# 어드민 채팅 미디어 업로드 구현 가이드

## 개요

어드민 페이지(React + Vite)에서 채팅 메시지에 이미지, 영상, 파일을 첨부하여 전송하는 기능 구현 가이드입니다.

---

## 환경 설정

### 백엔드 API 엔드포인트

#### 개발 환경 (Development)
- **HTTP Base**: `https://dev.baseapi.funpik.net:9100`
- **WS Base**: `wss://dev.baseapi.funpik.net:9100`

#### 운영 환경 (Production)
- **HTTP Base**: `https://production.baseapi.funpik.net:9100`
- **WS Base**: `wss://production.baseapi.funpik.net:9100`


### 환경 변수 설정 (Vite)

`.env.development`:
```env
VITE_API_BASE_URL=https://dev.baseapi.funpik.net:9100
```

`.env.production`:
```env
VITE_API_BASE_URL=https://production.baseapi.funpik.net:9100
```

`.env.local`:
```env
VITE_API_BASE_URL=http://192.168.0.6:8000
```

---

## API 엔드포인트

### 1. 미디어 업로드 API

**엔드포인트**: `POST /media/upload`

**Content-Type**: `multipart/form-data`

**요청 파라미터**:
- `file` (File): 업로드할 파일 (이미지/영상/일반 파일)

**응답 예시**:
```json
{
  "fileUrl": "https://funpik-development-media.s3.ap-northeast-2.amazonaws.com/chat-media/images/1/xxx/image.png",
  "thumbnailUrl": "https://funpik-development-media.s3.ap-northeast-2.amazonaws.com/chat-media/images/1/xxx/thumb.png",
  "fileSize": 1024000,
  "mimeType": "image/png",
  "fileName": "image.png",
  "width": 1920,
  "height": 1080,
  "duration": null
}
```

**파일 크기 제한**:
- 이미지: 최대 10MB
- 영상: 최대 100MB
- 일반 파일: 최대 50MB

**자동 생성 기능**:
- 이미지: 썸네일 자동 생성 (최대 800px)
- 영상: 썸네일 자동 생성 (1초 지점 프레임)

---

### 2. 메시지 생성 API

#### 2-1. 일반 메시지 생성

**엔드포인트**: `POST /messages`

**Content-Type**: `application/json`

**요청 본문**:
```json
{
  "roomId": 1,
  "text": "메시지 텍스트 (필수, 최소 1자, 최대 5000자)",
  "srcHint": "ko",
  "targets": ["en", "ja"],
  "parentId": null,
  "nickname": "관리자",
  "chatTitle": null,
  "isPremium": false,
  "achievementName": null,
  "media": {
    "type": "image",
    "fileUrl": "https://...",
    "thumbnailUrl": "https://...",
    "fileSize": 1024000,
    "mimeType": "image/png",
    "fileName": "image.png",
    "width": 1920,
    "height": 1080,
    "duration": null,
    "linkUrl": null,
    "linkTitle": null,
    "linkDescription": null,
    "linkImageUrl": null,
    "linkSiteName": null
  }
}
```

#### 2-2. 어드민 메시지 생성

**엔드포인트**: `POST /messages/admin`

**Content-Type**: `application/json`

**요청 본문**:
```json
{
  "roomId": 1,
  "text": "어드민 메시지",
  "srcLang": "ko",
  "targets": ["en", "ja"],
  "parentId": null,
  "adminId": "admin",
  "media": {
    "type": "image",
    "fileUrl": "https://...",
    "thumbnailUrl": "https://...",
    "fileSize": 1024000,
    "mimeType": "image/png",
    "fileName": "image.png",
    "width": 1920,
    "height": 1080
  }
}
```

**미디어 타입별 필수/선택 필드**:

| 타입 | 필수 필드 | 선택 필드 |
|------|----------|----------|
| `image` | `type`, `fileUrl`, `fileSize`, `mimeType`, `fileName` | `thumbnailUrl`, `width`, `height` |
| `video` | `type`, `fileUrl`, `fileSize`, `mimeType`, `fileName` | `thumbnailUrl`, `width`, `height`, `duration` |
| `file` | `type`, `fileUrl`, `fileSize`, `mimeType`, `fileName` | `thumbnailUrl` |
| `link` | `type`, `linkUrl` | `linkTitle`, `linkDescription`, `linkImageUrl`, `linkSiteName` |

---

### 3. 채팅 목록 조회 API

#### 3-1. 방별 메시지 목록 조회

**엔드포인트**: `GET /messages/room/{roomId}`

**Query 파라미터**:
- `preferredLang` (필수): 선호 언어 (예: `ko`, `en`, `ja`, `zh-Hant`)
- `beforeId` (선택): 이 ID보다 작은 메시지만 조회 (페이지네이션)
- `limit` (선택): 조회할 메시지 수 (기본값: 50, 최대: 200)
- `viewerId` (선택): 요청자 userId (자기 글은 원문 표시)

**응답 예시**:
```json
{
  "items": [
    {
      "id": 321,
      "roomId": 1,
      "userId": "test-user-123",
      "nickname": "관리자",
      "chatTitle": null,
      "isPremium": false,
      "achievementName": null,
      "messageType": "user",
      "mediaType": "image",
      "srcLang": "ko",
      "displayText": "안녕하세요 오늘 뉴스 공유합니다. https://www.google.com 모두 좋은 하루 되세요",
      "origText": "안녕하세요 오늘 뉴스 공유합니다. https://www.google.com 모두 좋은 하루 되세요",
      "ts": "2026-01-19T09:08:35.203772+00:00",
      "koText": null,
      "parentId": null,
      "parentPreviewText": null,
      "isDeleted": false,
      "deletedAt": "",
      "deletedBy": null,
      "startColor": null,
      "endColor": null,
      "symbolColor": null,
      "parentAuthorUserId": null,
      "parentAuthorNickname": null,
      "parentDeleted": false,
      "media": {
        "type": "image",
        "fileUrl": "https://...",
        "thumbnailUrl": "https://...",
        "fileSize": 1024000,
        "mimeType": "image/png",
        "fileName": "image.png",
        "width": 1920,
        "height": 1080,
        "duration": null
      }
    }
  ],
  "nextBeforeId": 320
}
```

**주의사항**:
- 최근 3일치 메시지만 조회됩니다.
- `system` 메시지는 최근 12시간만 포함됩니다.

#### 3-2. 글로벌 메시지 목록 조회

**엔드포인트**: `GET /messages`

**Query 파라미터**: 방별 조회와 동일

**설명**: `roomId` 없이 호출하면 기본 글로벌 방을 조회합니다.

---

## 구현 예제

### 1. 파일 업로드 함수

```typescript
// utils/mediaUpload.ts
interface MediaUploadResponse {
  fileUrl: string;
  thumbnailUrl: string | null;
  fileSize: number;
  mimeType: string;
  fileName: string;
  width: number | null;
  height: number | null;
  duration: number | null;
}

export async function uploadMedia(
  file: File,
  token: string
): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Content-Type은 자동 설정됨 (multipart/form-data)
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '파일 업로드 실패');
  }

  return await response.json();
}
```

### 2. 메시지 생성 함수

```typescript
// utils/messageService.ts
interface CreateMessageRequest {
  roomId: number;
  text: string;
  srcHint?: string;
  targets?: string[];
  parentId?: number;
  nickname?: string;
  chatTitle?: string;
  isPremium?: boolean;
  achievementName?: string;
  media?: {
    type: 'image' | 'video' | 'file' | 'link';
    fileUrl?: string;
    thumbnailUrl?: string | null;
    fileSize?: number;
    mimeType?: string;
    fileName?: string;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    linkUrl?: string;
    linkTitle?: string | null;
    linkDescription?: string | null;
    linkImageUrl?: string | null;
    linkSiteName?: string | null;
  };
}

export async function createMessage(
  data: CreateMessageRequest,
  token: string,
  isAdmin: boolean = false
): Promise<any> {
  const endpoint = isAdmin 
    ? '/messages/admin' 
    : '/messages';

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '메시지 생성 실패');
  }

  return await response.json();
}
```

### 3. 채팅 목록 조회 함수

```typescript
// utils/messageService.ts
interface MessageItem {
  id: number;
  roomId: number;
  userId: string;
  nickname: string | null;
  chatTitle: string | null;
  isPremium: boolean;
  achievementName: string | null;
  messageType: 'user' | 'system' | 'admin';
  mediaType: 'text' | 'image' | 'video' | 'file' | 'link';
  srcLang: string;
  displayText: string;
  origText: string;
  ts: string;
  koText: string | null;
  parentId: number | null;
  parentPreviewText: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  startColor: string | null;
  endColor: string | null;
  symbolColor: string | null;
  parentAuthorUserId: string | null;
  parentAuthorNickname: string | null;
  parentDeleted: boolean | null;
  media: {
    type: string;
    fileUrl?: string;
    thumbnailUrl?: string | null;
    fileSize?: number;
    mimeType?: string;
    fileName?: string;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    linkUrl?: string;
    linkTitle?: string | null;
    linkDescription?: string | null;
    linkImageUrl?: string | null;
    linkSiteName?: string | null;
  } | null;
}

interface ListMessagesResponse {
  items: MessageItem[];
  nextBeforeId: number | null;
}

export async function listRoomMessages(
  roomId: number,
  preferredLang: string = 'ko',
  beforeId?: number,
  limit: number = 50,
  viewerId?: string,
  token: string
): Promise<ListMessagesResponse> {
  const params = new URLSearchParams({
    preferredLang,
    limit: limit.toString(),
  });
  
  if (beforeId) {
    params.append('beforeId', beforeId.toString());
  }
  
  if (viewerId) {
    params.append('viewerId', viewerId);
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/messages/room/${roomId}?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '메시지 목록 조회 실패');
  }

  return await response.json();
}

export async function listGlobalMessages(
  preferredLang: string = 'ko',
  beforeId?: number,
  limit: number = 50,
  viewerId?: string,
  token: string
): Promise<ListMessagesResponse> {
  const params = new URLSearchParams({
    preferredLang,
    limit: limit.toString(),
  });
  
  if (beforeId) {
    params.append('beforeId', beforeId.toString());
  }
  
  if (viewerId) {
    params.append('viewerId', viewerId);
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/messages?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '메시지 목록 조회 실패');
  }

  return await response.json();
}
```

### 5. 채팅 입력 컴포넌트 예제

```tsx
// components/ChatComposer.tsx
import { useState } from 'react';
import { uploadMedia } from '../utils/mediaUpload';
import { createMessage } from '../utils/messageService';

interface ChatComposerProps {
  roomId: number;
  token: string;
  isAdmin?: boolean;
}

export function ChatComposer({ roomId, token, isAdmin = false }: ChatComposerProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증
      const maxSize = file.type.startsWith('image/') 
        ? 10 * 1024 * 1024  // 10MB
        : file.type.startsWith('video/')
        ? 100 * 1024 * 1024 // 100MB
        : 50 * 1024 * 1024; // 50MB

      if (file.size > maxSize) {
        alert(`파일 크기가 너무 큽니다. (최대 ${maxSize / 1024 / 1024}MB)`);
        return;
      }

      setSelectedFile(file);
    }
  };

  const detectMediaType = (file: File): 'image' | 'video' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedFile) {
      alert('메시지 또는 파일을 입력해주세요.');
      return;
    }

    setSending(true);

    try {
      let mediaData = null;

      // 1. 파일이 있으면 먼저 업로드
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadMedia(selectedFile, token);
        
        mediaData = {
          type: detectMediaType(selectedFile),
          fileUrl: uploadResult.fileUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          fileName: uploadResult.fileName,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
        };
        setUploading(false);
      }

      // 2. 메시지 생성
      const messageData = {
        roomId,
        text: text.trim() || (mediaData ? '📎' : ''), // 파일만 있으면 기본 텍스트
        ...(isAdmin ? {} : {
          nickname: '관리자',
          isPremium: false,
        }),
        ...(mediaData ? { media: mediaData } : {}),
      };

      await createMessage(messageData, token, isAdmin);

      // 성공 시 초기화
      setText('');
      setSelectedFile(null);
      alert('메시지가 전송되었습니다.');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert(`전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setUploading(false);
      setSending(false);
    }
  };

  return (
    <div className="chat-composer">
      <div className="composer-input-area">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={uploading || sending}
        />
        
        <input
          type="file"
          id="file-input"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading || sending}
        />
        <label htmlFor="file-input" className="file-button">
          📎 파일 선택
        </label>

        {selectedFile && (
          <div className="file-preview">
            <span>{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)}>✕</button>
          </div>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={uploading || sending || (!text.trim() && !selectedFile)}
        className="send-button"
      >
        {uploading ? '업로드 중...' : sending ? '전송 중...' : '전송'}
      </button>
    </div>
  );
}
```

---

## 전체 플로우

```
1. 사용자가 파일 선택
   ↓
2. 파일 크기 검증 (이미지: 10MB, 영상: 100MB, 파일: 50MB)
   ↓
3. POST /media/upload 호출 (FormData)
   ↓
4. 업로드 응답 받기 (fileUrl, thumbnailUrl 등)
   ↓
5. POST /messages 또는 POST /messages/admin 호출
   - media 필드에 업로드 결과 포함
   ↓
6. 성공 시 UI 초기화
```

---

## 에러 처리

### 파일 업로드 실패
- 파일 크기 초과: 사용자에게 크기 제한 안내
- 네트워크 오류: 재시도 옵션 제공
- 서버 오류: 에러 메시지 표시

### 메시지 생성 실패
- 필수 필드 누락: 검증 메시지 표시
- 인증 실패: 로그인 페이지로 리다이렉트
- 서버 오류: 에러 메시지 표시

---

## 참고사항

1. **인증**: 모든 API 호출 시 JWT 토큰이 필요합니다.
2. **CORS**: 백엔드에서 어드민 도메인을 허용하도록 설정되어 있어야 합니다.
3. **파일 미리보기**: 선택된 파일의 미리보기를 표시하면 사용자 경험이 향상됩니다.
4. **진행도 표시**: 큰 파일 업로드 시 진행률 표시를 권장합니다.
5. **에러 복구**: 업로드 실패 시 재시도 기능을 고려하세요.

---

## 테스트 체크리스트

- [ ] 이미지 업로드 및 전송
- [ ] 영상 업로드 및 전송
- [ ] 일반 파일 업로드 및 전송
- [ ] 텍스트만 전송
- [ ] 텍스트 + 미디어 함께 전송
- [ ] 파일 크기 제한 검증
- [ ] 업로드 실패 처리
- [ ] 메시지 전송 실패 처리
- [ ] 개발/운영 환경별 API 엔드포인트 확인
- [ ] 채팅 목록 조회 (방별)
- [ ] 채팅 목록 조회 (글로벌)
- [ ] 페이지네이션 (더 보기)
- [ ] 미디어 타입별 표시 (이미지/영상/파일/링크)
