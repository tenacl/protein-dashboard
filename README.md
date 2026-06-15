# 🥩 단백질 트래커

타이칸의 일일 단백질 섭취 + 몸무게 추적 대시보드. 정적 사이트(GitHub Pages)로 호스팅하고,
익환(에이전트)이 데이터를 갱신해 push하면 반영된다.

- **단백질**: 공개. 일일 리스트 · 목표선(160g) · 14일 추이 · 월 캘린더 히트맵.
- **몸무게**: AES-GCM 암호화. 브라우저에서 암호를 입력해야만 복호화돼 보인다. 외부에선 못 봄.

## 데이터 갱신

### 단백질 추가
`data/protein-log.json`의 `entries`에 추가:
```json
{ "date": "2026-06-15", "name": "닭가슴살 200g", "grams": 46, "time": "12:30" }
```
그 뒤 commit + push.

### 몸무게 추가 (암호화)
```bash
PASSPHRASE="<암호>" node tools/encrypt-weight.mjs 2026-06-15 88.4
```
→ `data/weight-log.json`에 암호화돼 저장됨. 그 뒤 commit + push.
암호는 이 repo에 절대 넣지 않는다.

## 로컬 미리보기
```bash
python3 -m http.server 8000
# http://localhost:8000
```
