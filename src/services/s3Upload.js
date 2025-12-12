import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'

// AWS 설정 - 환경 변수에서 가져오기 (강력한 trim 처리)
const getEnvVar = (key, defaultValue = '') => {
  const value = import.meta.env[key]
  if (!value) return defaultValue
  // 모든 공백, 줄바꿈, 탭, 특수문자 제거 후 trim
  const cleaned = String(value).replace(/[\s\n\r\t]+/g, '').trim()
  return cleaned || defaultValue
}

const S3_BUCKET_NAME = getEnvVar('VITE_S3_BUCKET_NAME', 'funpik-development-media')
const AWS_ACCESS_KEY_ID = getEnvVar('VITE_AWS_ACCESS_KEY_ID', '')
const AWS_SECRET_ACCESS_KEY = getEnvVar('VITE_AWS_SECRET_ACCESS_KEY', '')
const AWS_S3_REGION = getEnvVar('VITE_AWS_S3_REGION', 'ap-northeast-2')

// 디버깅용 로그
console.log('AWS Config:', {
  bucket: S3_BUCKET_NAME,
  region: `"${AWS_S3_REGION}"`,
  regionLength: AWS_S3_REGION.length,
  regionChars: AWS_S3_REGION.split('').map(c => `'${c}'`).join(''),
  hasAccessKey: !!AWS_ACCESS_KEY_ID,
  hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
  accessKeyLength: AWS_ACCESS_KEY_ID.length,
})

// 자격 증명 검증
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('AWS 자격 증명이 설정되지 않았습니다.')
  console.error('환경 변수 확인:', {
    VITE_AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    VITE_AWS_SECRET_ACCESS_KEY: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY ? '***설정됨***' : '없음',
  })
}

// S3 클라이언트 생성
const s3Client = new S3Client({
  region: AWS_S3_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined,
})

/**
 * 파일을 S3에 업로드
 * @param {File} file - 업로드할 파일
 * @param {string} folder - S3 폴더 경로 (예: 'image/popup')
 * @returns {Promise<string>} 업로드된 파일의 URL
 */
export async function uploadToS3(file, folder = 'image/popup') {
  try {
    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now()
    // 파일명에서 특수문자 제거
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${folder}/${timestamp}_${sanitizedFileName}`
    
    // 파일을 ArrayBuffer로 변환 후 Uint8Array로 변환
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // S3에 업로드
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
      Body: uint8Array,
      ContentType: file.type || 'image/jpeg',
    })
    
    await s3Client.send(command)
    
    // 업로드된 파일의 URL 반환
    const url = `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${fileName}`
    return url
  } catch (error) {
    console.error('S3 업로드 실패:', error)
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`)
  }
}

/**
 * S3에서 이미지 목록 조회
 * @param {string} folder - S3 폴더 경로 (예: 'image/popup')
 * @returns {Promise<Array>} 이미지 목록 (URL, 파일명 등)
 */
export async function listS3Images(folder = 'image/popup') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: folder + '/',
    })
    
    const response = await s3Client.send(command)
    
    console.log('S3 응답:', response)
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('S3에 이미지가 없습니다.')
      return []
    }
    
    // 이미지 파일만 필터링 (확장자 체크)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const images = response.Contents
      .filter(item => {
        const key = item.Key || ''
        // 폴더 자체는 제외
        if (key.endsWith('/')) {
          return false
        }
        const extension = key.toLowerCase().substring(key.lastIndexOf('.'))
        return imageExtensions.includes(extension)
      })
      .map(item => {
        const key = item.Key || ''
        const url = `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${key}`
        const fileName = key.substring(key.lastIndexOf('/') + 1)
        
        return {
          key: key,
          url: url,
          fileName: fileName,
          size: item.Size || 0,
          lastModified: item.LastModified,
        }
      })
      .sort((a, b) => {
        // 최신순 정렬
        if (b.lastModified && a.lastModified) {
          return b.lastModified.getTime() - a.lastModified.getTime()
        }
        return 0
      })
    
    console.log('필터링된 이미지 목록:', images)
    return images
  } catch (error) {
    console.error('S3 이미지 목록 조회 실패:', error)
    console.error('에러 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      $metadata: error.$metadata,
    })
    
    // CORS 에러 체크
    const errorMessage = error.message || ''
    const errorString = String(error)
    if (
      errorMessage.includes('ERR_FAILED') || 
      errorMessage.includes('CORS') || 
      errorMessage.includes('Failed to fetch') ||
      errorString.includes('ERR_FAILED') ||
      error.name === 'TypeError'
    ) {
      throw new Error(
        'CORS 오류가 발생했습니다. S3 버킷에 CORS 설정이 필요합니다.\n\n' +
        'AWS 콘솔에서 S3 버킷(funpik-development-media)의 권한 탭 → CORS 설정에 다음을 추가하세요:\n\n' +
        '[\n' +
        '  {\n' +
        '    "AllowedHeaders": ["*"],\n' +
        '    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],\n' +
        '    "AllowedOrigins": ["*"],\n' +
        '    "ExposeHeaders": ["ETag"],\n' +
        '    "MaxAgeSeconds": 3000\n' +
        '  }\n' +
        ']'
      )
    }
    
    // 더 자세한 에러 메시지
    let errorMsg = '이미지 목록을 불러오는데 실패했습니다.'
    if (error.name === 'AccessDenied') {
      errorMsg = 'S3 접근 권한이 없습니다. AWS 자격 증명을 확인해주세요.'
    } else if (error.name === 'NoSuchBucket') {
      errorMsg = 'S3 버킷을 찾을 수 없습니다.'
    } else if (error.message) {
      errorMsg = `이미지 목록 조회 실패: ${error.message}`
    }
    
    throw new Error(errorMsg)
  }
}

/**
 * S3에서 이미지 삭제
 * @param {string} key - S3 객체 키 (파일 경로)
 */
export async function deleteS3Image(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
    
    await s3Client.send(command)
  } catch (error) {
    console.error('S3 이미지 삭제 실패:', error)
    throw new Error(`이미지 삭제에 실패했습니다: ${error.message}`)
  }
}

