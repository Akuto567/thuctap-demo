# Dự án Template

Thư mục này chứa **các dự án game template** — những ứng dụng web độc lập định nghĩa các trò chơi mà giáo viên có thể tạo với Minigame Builder.

---

## ⚡ Bắt đầu Nhanh (Sau khi Clone)

**Cài đặt lần đầu:**

```bash
# 1. Vào thư mục template-projects
cd template-projects

# 2. Cài đặt dependencies
yarn install

# 3. Build các shared libraries (BẮT BUỘC trước khi phát triển)
yarn build:shared
```

**Sau đó làm việc với game của bạn:**

```bash
cd group-sort
yarn dev
```

> ⚠️ **Quan trọng:** Bạn phải build các shared libraries **trước** khi có thể sử dụng chúng trong dự án game.

---

## Cấu trúc Dự án

```
template-projects/
├── shared/                     # Các component thư viện dùng chung
│   └── tutorial-viewer/        # Xem ảnh hướng dẫn (template cho các thư viện tương lai)
│       ├── src/
│       ├── package.json
│       ├── vite.config.ts      # Dùng vite-plugin-css-injected-by-js
│       └── dist/               # Output sau khi build
│
├── group-sort/                 # Các game template (làm việc trực tiếp trong các thư mục này)
├── balloon-letter-picker/
├── labelled-diagram/
├── pair-matching/
├── plane-quiz/
├── whack-a-mole/
└── word-search/
```

---

## Dành cho Tác giả Game Template

### Quy trình Làm việc Hàng ngày

Sau khi cài đặt ban đầu, bạn có thể làm việc **trực tiếp trong thư mục game của mình**:

```bash
cd group-sort
yarn dev      # Khởi động server phát triển
yarn build    # Build cho production
```

Bạn **không cần** phải quay lại thư mục gốc mỗi lần.

### Sử dụng Shared Components

Các shared components như `@minigame/tutorial-viewer` có sẵn dưới dạng workspace packages:

**1. Thêm vào `package.json` của bạn:**

```json
{
  "dependencies": {
    "@minigame/tutorial-viewer": "workspace:*"
  }
}
```

**2. Cài đặt dependencies** (từ thư mục gốc `template-projects` hoặc thư mục game của bạn):

```bash
cd template-projects
yarn install
```

**3. Sử dụng trong code:**

```tsx
import { TutorialViewer } from "@minigame/tutorial-viewer";

function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowTutorial(true)}>
        Hướng dẫn
      </button>
      <TutorialViewer
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </>
  );
}
```

> 💡 **Lưu ý:** Không cần import CSS! CSS được bundle vào JavaScript output.

### Quan trọng: Tệp yarn.lock

**KHÔNG commit tệp `yarn.lock` trong các thư mục game riêng lẻ** trừ khi thư mục đó thực sự là root của dự án.

**Tại sao?** Nếu tồn tại `yarn.lock` trong thư mục game (ví dụ: `group-sort/yarn.lock`), Yarn sẽ coi thư mục đó là root dự án thay vì nhận diện workspace. Điều này gây ra:
- Lỗi "workspace not found" với protocol `workspace:*`
- Dependencies không được liên kết đúng cách

**Giải pháp:** Nếu gặp lỗi này:
```bash
# Xóa yarn.lock xung đột
rm group-sort/yarn.lock

# Cài đặt lại từ root workspace
cd template-projects
yarn install
```

---

## Lệnh Build

### Build Tất cả (Shared + Games)

```bash
cd template-projects
yarn build:all
```

Lệnh này build các shared libraries trước, sau đó build tất cả game templates.

### Build Shared Libraries Only

```bash
cd template-projects
yarn build:shared
```

Chạy lệnh này **trước** khi phát triển nếu bạn sử dụng shared components.

### Build Từng Game Riêng Lẻ

```bash
cd template-projects
yarn build:group-sort
yarn build:balloon-letter-picker
yarn build:labelled-diagram
yarn build:pair-matching
yarn build:plane-quiz
yarn build:whack-a-mole
yarn build:word-search
```

Hoặc từ trong thư mục game:
```bash
cd group-sort
yarn build
```

---

## Tạo Shared Libraries Mới

`shared/tutorial-viewer` đóng vai trò **template** cho các shared components trong tương lai. Để tạo một shared library mới:

### 1. Copy Template

```bash
cd template-projects/shared
cp -r tutorial-viewer your-component-name
```

### 2. Cập nhật package.json

```json
{
  "name": "@minigame/your-component-name",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.umd.js",
  "module": "./dist/index.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.es.js",
      "require": "./dist/index.umd.js"
    }
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  }
}
```

### 3. Cấu hình Quan trọng

Template sử dụng **`vite-plugin-css-injected-by-js`** để bundle CSS vào output JavaScript. Điều này có nghĩa:

- ✅ **Không cần import CSS** trong các dự án sử dụng
- ✅ **Không cần thay đổi vite config** trong các dự án sử dụng
- ✅ **Chỉ cần một import duy nhất**: `import { YourComponent } from "@minigame/your-component"`

### 4. Cập nhật Component của Bạn

Thay thế code component trong `src/` bằng code của bạn. Giữ các pattern sau:

- Sử dụng CSS Modules (`.module.css`) cho scoped styles
- Export từ `src/index.ts`
- Build tạo output trong `dist/`

### 5. Đăng ký trong Workspace

Thêm vào root `package.json` workspaces (đã bao gồm `shared/*`):

```json
{
  "workspaces": [
    "shared/*",
    "group-sort",
    "...other games"
  ]
}
```

Workspace tự động bao gồm tất cả packages trong `shared/*`.

---

## Thêm Game Template Mới

Làm theo các bước sau để thêm game template mới:

### Bước 1: Tạo Dự án Game

Copy một template hiện có để bắt đầu:

```bash
cd template-projects
cp -r group-sort my-new-game
```

### Bước 2: Cập nhật package.json

Chỉnh sửa `my-new-game/package.json`:

```json
{
  "name": "my-new-game",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    // ... dependencies của bạn
  },
  "packageManager": "yarn@4.13.0"
}
```

> ⚠️ **Quan trọng:** Trường `"name"` **phải khớp với tên thư mục** chính xác.

### Bước 3: Đăng ký trong Workspace

Chỉnh sửa `template-projects/package.json` và thêm game của bạn vào `workspaces`:

```json
{
  "name": "minigame-templates",
  "private": true,
  "workspaces": [
    "shared/*",
    "group-sort",
    "balloon-letter-picker",
    "labelled-diagram",
    "pair-matching",
    "plane-quiz",
    "whack-a-mole",
    "word-search",
    "my-new-game"
  ],
  "scripts": {
    "build:shared": "yarn workspaces foreach -p --include '@minigame/*' run build",
    "build:all": "yarn build:shared && yarn workspaces foreach -p --exclude '@minigame/*' --exclude 'minigame-templates' run build",
    "build:group-sort": "yarn workspace group-sort run build",
    "build:balloon-letter-picker": "yarn workspace balloon-letter-picker run build",
    "build:labelled-diagram": "yarn workspace labelled-diagram run build",
    "build:pair-matching": "yarn workspace pair-matching run build",
    "build:plane-quiz": "yarn workspace plane-quiz run build",
    "build:whack-a-mole": "yarn workspace whack-a-mole run build",
    "build:word-search": "yarn workspace word-search run build",
    "build:my-new-game": "yarn workspace my-new-game run build"
  },
  "packageManager": "yarn@4.13.0"
}
```

Thêm script mới cho game của bạn:
```json
"build:my-new-game": "yarn workspace my-new-game run build"
```

### Bước 4: Cài đặt Dependencies

```bash
cd template-projects
yarn install
```

### Bước 5: Tạo meta.json

Tạo `my-new-game/meta.json`:

```json
{
  "name": "Tên Game của Bạn",
  "description": "Một câu mô tả hiển thị trên màn hình chính.",
  "gameType": "my-new-game",
  "version": "1.0.0"
}
```

Tùy chọn thêm `thumbnail.png` cho thumbnail màn hình chính.

### Bước 6: Đăng ký trong build-templates.sh

Chỉnh sửa root `build-templates.sh` và thêm game của bạn vào mảng `GAMES`:

```bash
GAMES=(
  "group-sort|group-sort"
  "plane-quiz|plane-quiz"
  "balloon-letter-picker|balloon-letter-picker"
  "pair-matching|pair-matching"
  "word-search|word-search"
  "whack-a-mole|whack-a-mole"
  "my-new-game|my-new-game"  # Thêm dòng này
)
```

### Bước 7: Đăng ký trong CI/CD

Chỉnh sửa `.github/workflows/build-all.yml` và thêm game của bạn vào build matrix.

### Bước 8: Kiểm tra

```bash
cd template-projects
yarn build:my-new-game
```

---

## Tổng quan

Mỗi thư mục con ở đây là một ứng dụng web hoàn chỉnh, độc lập:

- Sử dụng **bất kỳ công cụ nào** bạn muốn (Vite, Webpack, Rollup, v.v.)
- Build thành một tệp **`index.html` duy nhất** (qua `vite-plugin-singlefile` hoặc tương đương)
- Đọc dữ liệu do giáo viên tạo từ `window.APP_DATA` tại runtime
- Hoạt động hoàn toàn ngoại tuyến trên bất kỳ trình duyệt nào

## Điểm Bắt đầu Khuyến nghị

**Sử dụng `group-sort/` làm template.** Nó được cấu hình với:

- ✅ Vite + React 19
- ✅ React Compiler (tự động memoization)
- ✅ `vite-plugin-singlefile` cho đầu ra một tệp
- ✅ Tích hợp `window.APP_DATA` đúng cách
- ✅ Các thực hành tốt nhất hiện đại

Copy để bắt đầu:

```bash
cp -r template-projects/group-sort template-projects/my-new-game
```

## Công cụ Không bị Giới hạn

Mặc dù `group-sort` sử dụng Vite + React, bạn có thể dùng **bất cứ thứ gì**:

- Vue, Svelte, Angular, Solid
- Vanilla JavaScript
- Preact, Alpine.js
- Bất kỳ công cụ build nào (Vite, Webpack, Parcel, esbuild)

**Chỉ đầu ra build là quan trọng** (xem yêu cầu bên dưới).

## Yêu cầu

### Đầu ra Build

Template của bạn phải tạo ra:

| Tệp                  | Yêu cầu                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `index.html`         | **HTML một tệp** — tất cả JS/CSS được nhúng trực tiếp. Dùng `vite-plugin-singlefile` hoặc tương đương. |
| `images/` (tùy chọn) | Các tài sản hình ảnh không thể nhúng trực tiếp. Giữ ở mức tối thiểu.                         |

> ⚠️ **Không có tài sản khác.** Fonts, icons, SVG nhỏ nên được nhúng trực tiếp vào HTML.

### Runtime Data Contract

Builder inject dữ liệu do giáo viên tạo trước thẻ `<script>` đầu tiên:

```html
<script>
  window.APP_DATA = {
    /* dữ liệu của giáo viên */
  };
  window.MY_APP_DATA = window.APP_DATA; // legacy alias
  window.win = { DATA: window.APP_DATA }; // legacy alias
</script>
```

Game của bạn đọc `window.APP_DATA` khi khởi động. Cấu trúc do bạn quyết định!

### `meta.json`

Mỗi template phải có `meta.json` ở cấp độ root:

```json
{
  "name": "Tên Game dễ đọc",
  "description": "Một câu mô tả hiển thị trên màn hình chính.",
  "gameType": "your-game-id",
  "version": "1.0.0"
}
```

Tùy chọn thêm `thumbnail.png` cho thumbnail màn hình chính.

---

## Quy trình Phát triển

### 1. Phát triển Game của Bạn

```bash
cd template-projects/group-sort
yarn install
yarn dev
```

Game của bạn nên hoạt động độc lập trong trình duyệt khi phát triển.

### 2. Kiểm tra với Mock Data

Trong console trình duyệt, đặt mock data:

```javascript
window.APP_DATA = {
  // Cấu trúc dữ liệu game của bạn
  items: [{ id: "1", text: "Xin chào" }],
};
```

### 3. Build và Kiểm tra trong Builder

```bash
# Từ root template-projects
yarn build:all

# Chạy builder
cd ../builder-projects/electron-app-mui
yarn dev
```

### 4. Xác minh Tích hợp

- [ ] Game xuất hiện trên màn hình chính của builder
- [ ] Tạo project hoạt động
- [ ] Editor có thể sửa dữ liệu
- [ ] Preview hiển thị game của bạn với dữ liệu
- [ ] Export tạo ra game standalone hoạt động

---

## Dành cho AI Chatbots

**Ngữ cảnh**: Thư mục này (`template-projects/`) chứa **mã nguồn** của tất cả các game templates. Mỗi cái là một ứng dụng web độc lập với `package.json`, dependencies và quy trình build riêng.

**Quan trọng**: Đầu ra build nằm trong `builder-projects/electron-app-mui/templates/<game-id>/game/`. Các thư mục đó chỉ chứa **tệp `index.html` đã bundle/minified** (và tùy chọn là thư mục `images/`). Không có mã nguồn hữu ích nào để đọc trong các thư mục output build đó — chúng chỉ tồn tại để sử dụng runtime bởi ứng dụng Electron. **Luôn đọc từ `template-projects/<game-id>/`** để hiểu logic game và mã nguồn. Đọc nội dung thư mục `game/` sẽ lãng phí context window của bạn với code đã minified.

**Các Tệp Quan trọng** (trong mỗi thư mục `template-projects/<game-id>/`):

- `meta.json` — Đăng ký template (tên, mô tả, gameType)
- `vite.config.ts` — Cấu hình build
- `src/` — Mã nguồn game
- `images/` — Tài sản game

**Lệnh Build**: `yarn build` (trong mỗi thư mục template)

**Đầu ra**: Single `index.html` + thư mục `images/` (copy vào `builder-projects/electron-app-mui/templates/`)

---

## Khắc phục Sự cố

### Lỗi "Workspace not found"

**Nguyên nhân:** Tệp `yarn.lock` tồn tại trong thư mục game của bạn, khiến Yarn coi đó là root dự án.

**Giải pháp:**
```bash
# Xóa yarn.lock xung đột
rm group-sort/yarn.lock

# Cài đặt lại từ root workspace
cd template-projects
yarn install
```

### Lỗi "Module not found: @minigame/tutorial-viewer"

**Nguyên nhân:** Shared libraries chưa được build.

**Giải pháp:**
```bash
cd template-projects
yarn build:shared
```

### TypeScript không tìm thấy types

**Giải pháp:** Khởi động lại TypeScript server trong IDE của bạn:
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Thay đổi trong shared components không xuất hiện

**Nhớ rằng:** Shared libraries phải được build lại sau khi thay đổi:
```bash
cd template-projects/shared/tutorial-viewer
yarn build
```

Sau đó khởi động lại dev server của game của bạn.

---

## Tài nguyên

- [Root README](../../README.md) - Tài liệu dự án chính
- [Tutorial Viewer README](shared/tutorial-viewer/README.md) - Hướng dẫn sử dụng component
