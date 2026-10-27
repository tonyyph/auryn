# Auryn — hồ sơ chuẩn bị submit App Store

File này gom mọi thông tin App Store Connect sẽ hỏi khi submit bản 1.0.0.

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Đã điền sẵn từ code/cấu hình của app. Chỉ cần kiểm lại. |
| ✍️ | Bản nháp đề xuất. Sửa thoải mái. |
| ⟨…⟩ | Bạn phải tự điền. Tôi không có thông tin này hoặc đây là quyết định của bạn. |

Sửa xong các ô chữ (tên, phụ đề, mô tả, từ khoá…), chạy:

```bash
node store/check-metadata.mjs      # kiểm giới hạn ký tự/byte của Apple cho từng ô
```

- **Nguồn quy định Apple** (kiểm tra ngày 2026-10-22):
  - [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information)
  - [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)
  - [Age ratings](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions)
  - [Screenshot](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) / [App Preview](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications) specifications
  - [Accessibility Nutrition Labels](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels)
- **Ngôn ngữ listing:** en-US (chính) và vi.

---

## 1. Tài khoản và tạo app

| Mục | Giá trị | |
|---|---|---|
| Apple ID dùng để submit | `ynotechcially@gmail.com` (lấy từ `eas.json` → `submit.production.ios.appleId`) | ✅ kiểm lại |
| Team / tài khoản Developer | ⟨tên team, Team ID 10 ký tự⟩ | ⟨…⟩ |
| Expo owner / EAS project | `cuongphan2` · `1800b42f-aeb0-4e08-8240-d191a5833cad` | ✅ |
| Bundle ID | `com.auryn.numbers`. **Không đổi được sau khi upload build đầu tiên.** | ✅ |
| SKU | ⟨vd. `auryn-ios-001`⟩. Gồm chữ, số, `-`, `.`, `_`; không bắt đầu bằng ký tự đặc biệt; không đổi được. | ⟨…⟩ |
| Ngôn ngữ chính | English (U.S.) | ✍️ |
| App Store Connect App ID (`ascAppId`) | ⟨dãy số, có sau khi tạo app trong App Store Connect⟩. Thêm vào `eas.json` → `submit.production.ios.ascAppId`, để `eas submit` không phải hỏi. | ⟨…⟩ |
| Nền tảng | iOS. Bản này chạy cả iPhone và iPad vì `supportsTablet: true`, nên phải có screenshot iPad 13". | ✅ |

## 2. App Information (chung cho mọi phiên bản)

### Tên app (2–30 ký tự)

Tên phải là duy nhất trên App Store. Tôi **chưa kiểm** "Auryn" còn trống không; App Store Connect sẽ báo khi bạn tạo app. Nếu trùng, dùng phương án kèm hậu tố.

<!-- field: name.en-US | max 30 chars | min 2 -->
```text
Auryn: 2048 Merge
```

<!-- field: name.vi | max 30 chars | min 2 -->
```text
Auryn: Ghép Số 2048
```

### Phụ đề (≤ 30 ký tự)

<!-- field: subtitle.en-US | max 30 chars -->
```text
Swipe tiles into the aurora
```

<!-- field: subtitle.vi | max 30 chars -->
```text
Vuốt và ghép dưới cực quang
```

### Danh mục

| Mục | Đề xuất | |
|---|---|---|
| Primary category | **Games** · subcategory **Puzzle** (+ **Casual** nếu muốn chọn 2) | ✍️ |
| Secondary category | ⟨tuỳ chọn, vd. Entertainment, hoặc để trống⟩ | ⟨…⟩ |

### Các mục còn lại

| Mục | Câu trả lời | |
|---|---|---|
| Content Rights | **No**: app không chứa, hiển thị hay truy cập nội dung bên thứ ba. Font Unbounded/Manrope dùng giấy phép SIL OFL. Âm thanh và hình nền do repo tự sinh (`tools/generate-*.mjs`). | ✅ |
| Privacy Policy URL (**bắt buộc**) | English: `https://auryn-app.vercel.app/privacy`. Tiếng Việt: `https://auryn-app.vercel.app/vi/privacy`. Nội dung theo **Phụ lục A**; mã nguồn ở `~/auryn-site` (Vercel, team DeepOcean, project `auryn-app`). | ✅ |
| User Privacy Choices URL | Để trống. App không thu thập dữ liệu nên không có lựa chọn nào cho người dùng. | ✅ |
| License Agreement | Dùng EULA chuẩn của Apple. | ✍️ |
| EU Digital Services Act: trader status | ⟨Trader / Non-trader⟩. Bắt buộc khai nếu phát hành ở EU. Nếu chọn **Trader**, Apple **hiển thị công khai** địa chỉ, email và số điện thoại của bạn trên trang app ở EU. Nếu không muốn, bỏ các nước EU khỏi phần Availability (mục 5). | ⟨…⟩ |
| Regulated Medical Device | Không. | ✅ |

## 3. Age Rating: bảng câu hỏi

Mọi câu đều trả lời theo code hiện tại. Kết quả dự kiến: **4+**.

| Nhóm | Câu hỏi | Trả lời |
|---|---|---|
| In-App Controls | Parental controls · Age assurance | No · No |
| Capabilities | Unrestricted web access | **No**: app không có trình duyệt, không gọi mạng. |
| | User-generated content · Social media · Messaging/chat | No · No · No |
| | Advertising | **No**: không có SDK quảng cáo. |
| Mature Themes | Profanity · Horror · Alcohol/tobacco/drugs | None · None · None |
| Medical or Wellness | Medical info · Health/wellness topics | None · None |
| Sexuality or Nudity | Tất cả các mục | None |
| Violence | Cartoon/realistic violence · Guns | None · None |
| Chance-Based Activities | Gambling · Simulated gambling | No · None |
| | Contests | **None**: chỉ có kỷ lục cá nhân, không có giải thưởng. |
| | Loot boxes | No |
| Made for Kids | Không chọn Kids Category. Đây là game cho mọi lứa tuổi, không nhắm riêng trẻ em. | ✍️ |

## 4. App Privacy ("nutrition label")

| Câu hỏi | Trả lời | Căn cứ |
|---|---|---|
| Do you or your third-party partners collect data from this app? | **No, we do not collect data from this app** | Không có backend, đăng nhập, analytics, quảng cáo hay SDK gọi mạng (đã grep `src/` và dependencies). Dữ liệu ván chơi, kỷ lục và cài đặt chỉ lưu trên máy bằng AsyncStorage. |
| Tracking | No | `PrivacyInfo.xcprivacy`: `NSPrivacyTracking = false`, `NSPrivacyCollectedDataTypes` rỗng. |
| Microphone | Không xin quyền | `app.json`: `microphonePermission: false`; Android chặn `RECORD_AUDIO`. |

**Lưu ý:** nếu sau này thêm Sentry, analytics, Game Center hay iCloud, phải khai lại mục này.

## 5. Giá và phát hành

| Mục | Giá trị | |
|---|---|---|
| Giá | **Free**. Không có In-App Purchase hay subscription. | ✅ |
| Availability | ⟨Tất cả quốc gia / bỏ EU nếu không khai DSA / danh sách riêng⟩ | ⟨…⟩ |
| Pre-order | Không | ✍️ |
| Version release | **Manual release**: Apple duyệt xong, bạn tự bấm phát hành. | ✍️ |
| Phased release | Không áp dụng cho bản 1.0 (chỉ dùng cho bản cập nhật). | ✅ |

## 6. Version 1.0.0: nội dung listing

| Mục | Giá trị | |
|---|---|---|
| Version | `1.0.0` (`app.json`). Build number do EAS tự tăng (`appVersionSource: remote`, `autoIncrement`). | ✅ |
| Copyright | ⟨vd. `2026 Phan Cuong` hoặc tên công ty⟩ | ⟨…⟩ |
| Support URL (**bắt buộc**) | English: `https://auryn-app.vercel.app/support`. Tiếng Việt: `https://auryn-app.vercel.app/vi/support`. Trang có email liên hệ `ynotechcially@gmail.com` và FAQ. | ✅ |
| Marketing URL | English: `https://auryn-app.vercel.app`. Tiếng Việt: `https://auryn-app.vercel.app/vi`. | ✅ |
| What's New | Không cần cho bản đầu tiên. | ✅ |

### Promotional Text (≤ 170 ký tự, sửa bất cứ lúc nào, không cần duyệt lại)

<!-- field: promo.en-US | max 170 chars -->
```text
Swipe, merge and chase 2048 under a living aurora. Take back your last move, pick up right where you left off, and keep climbing past 2048.
```

<!-- field: promo.vi | max 170 chars -->
```text
Vuốt, ghép và săn ô 2048 dưới bầu trời cực quang. Đi lại nước vừa rồi, mở app là chơi tiếp, và leo cao hơn cả 2048.
```

### Keywords (≤ 100 **byte** UTF-8, phân tách bằng dấu phẩy, mỗi từ > 2 ký tự)

- Không lặp lại các từ đã có trong tên và phụ đề, vì Apple đã tự lập chỉ mục chúng.
- Không dấu cách sau dấu phẩy.
- Tiếng Việt có dấu tốn 2–3 byte mỗi ký tự.

<!-- field: keywords.en-US | max 100 bytes -->
```text
puzzle,number,brain,logic,math,classic,grid,slide,combo,offline,casual,relax,undo,board,merging
```

<!-- field: keywords.vi | max 100 bytes -->
```text
câu đố,giải đố,trí tuệ,luyện não,toán,ô số,trò chơi,offline,cổ điển,puzzle
```

### Description (≤ 4000 ký tự, chữ thường, không HTML)

<!-- field: description.en-US | max 4000 chars -->
```text
Merge into the light.

Auryn is the classic 2048 number puzzle, rebuilt as a tactile arcade under a living aurora. Swipe, watch matching tiles crash together, and climb toward 2048 — then keep going.

HOW IT PLAYS
• Swipe in any direction and every tile slides as far as it can.
• Two equal tiles merge into one, doubled. That's your score.
• A new tile appears after every move. Fill the board and the run is over.

WHAT MAKES IT FEEL GOOD
• Keycap tiles in aurora colours, with a glow for the big ones.
• Combo callouts when one swipe lands several merges, and a shout-out when you make a new biggest tile.
• A tile ladder that shows what you've built and what's next.
• Crisp sound effects and haptics, each with its own switch.

PLAY YOUR WAY
• Undo: take back your last move — one step back, when you need it.
• Hit 2048, celebrate, then keep climbing on the same board.
• Your run saves itself. Close the app and pick up exactly where you left off.
• Records: best score, top tile, runs finished, runs that hit 2048 and total moves.
• Optional on-screen arrow pad and a reduced-motion setting.
• English and Vietnamese.

NO STRINGS
No account, no ads, no in-app purchases, and no internet needed. Your games stay on your device.
```

<!-- field: description.vi | max 4000 chars -->
```text
Chạm vào ánh sáng.

Auryn là trò ghép số 2048 kinh điển, được làm lại thành một trò arcade có cảm giác chạm thật dưới bầu trời cực quang. Vuốt, nhìn các ô cùng số va vào nhau rồi gộp lại, leo dần tới 2048 — và leo tiếp.

CÁCH CHƠI
• Vuốt theo bất kỳ hướng nào, mọi ô trượt hết cỡ theo hướng đó.
• Hai ô cùng số gộp thành một, giá trị gấp đôi. Đó chính là điểm của bạn.
• Sau mỗi nước đi sẽ có một ô mới. Kín bàn là hết ván.

VÌ SAO CHƠI ĐÃ TAY
• Ô số như phím bấm mang màu cực quang, ô càng lớn càng rực.
• Hiện COMBO khi một lần vuốt gộp được nhiều cặp, và hô to mỗi khi bạn tạo ra ô lớn nhất mới.
• Thang ô cho thấy bạn đã đạt tới đâu và mục tiêu kế tiếp.
• Âm thanh và rung phản hồi rõ ràng, bật tắt riêng từng thứ.

CHƠI THEO CÁCH CỦA BẠN
• Đi lại: lùi lại nước vừa rồi — một bước, đúng lúc cần.
• Chạm 2048, ăn mừng, rồi leo tiếp trên chính bàn đó.
• Ván chơi tự lưu. Đóng app, mở lại là chơi tiếp đúng chỗ cũ.
• Thành tích: kỷ lục điểm, ô lớn nhất, số ván đã chơi xong, số ván chạm 2048 và tổng số nước đi.
• Có bàn phím mũi tên trên màn hình và chế độ giảm chuyển động.
• Tiếng Việt và tiếng Anh.

KHÔNG RÀNG BUỘC
Không cần tài khoản, không quảng cáo, không mua trong app, không cần internet. Dữ liệu chơi chỉ nằm trên máy của bạn.
```

## 7. Screenshots và App Preview

Mọi file đã có sẵn. Upload theo đúng locale:

| Slot trong App Store Connect | File | Ghi chú |
|---|---|---|
| iPhone 6.9" (1320×2868) | `~/auryn-store-screenshots/exports/ios/iphone/1320x2868/{en-US,vi}/01…08.png` | Nên upload slot này. |
| iPhone 6.3" (1206×2622) | `…/iphone/1206x2622/{en-US,vi}/` | Apple chỉ bắt buộc slot này nếu không có ảnh 6.9"; bản có sẵn để dùng khi cần. |
| iPad 13" (2064×2752) | `…/ipad/2064x2752/{en-US,vi}/` | **Bắt buộc**, vì app chạy trên iPad. |
| App Preview iPhone | `~/auryn-store-previews/exports/{en-US,vi}/auryn-preview.mp4` (886×1920, khoảng 25 giây) | Poster frame: chọn khung COMBO ×3 ở **7,99 s (en-US)** / **8,37 s (vi)**; mặc định là 5 s. |
| App Preview iPad | ⟨chưa có; không bắt buộc⟩ | Có thể bỏ qua. |

**Header and Search Results** (tab riêng trên trang version; tuỳ chọn, hiển thị từ iOS/iPadOS 27):

| Chỗ dùng | File | Ghi chú |
|---|---|---|
| Universal (header + search) | `~/auryn-store-screenshots/exports/ios/creative-assets/universal-16x9/{en-US,vi}.png` (5244×2950) | Cách đơn giản nhất: một file cho cả hai chỗ. |
| Product page header | `…/creative-assets/header-21x9/{en-US,vi}.png` (3840×1646) | Dùng nếu muốn bản riêng, chữ to hơn so với bản universal. |
| Search results | `…/creative-assets/search-3x2/{en-US,vi}.png` (3840×2560) | Như trên. |

Trước khi lưu, bấm **Preview** để xem ảnh bị cắt ra sao trên từng thiết bị.

## 8. Accessibility Nutrition Labels (hiện là tuỳ chọn)

Khai cho iPhone và iPad. Chỉ đánh dấu những gì người dùng thực sự làm được **trong các tác vụ chính** (chơi, xem thành tích, cài đặt).

| Tính năng | Đề xuất | Căn cứ / việc cần làm |
|---|---|---|
| Dark Interface | ✍️ Có | App luôn dùng giao diện tối (`userInterfaceStyle: dark`). |
| Differentiate Without Color Alone | ✍️ Có | Mỗi ô đều ghi số; màu chỉ là phụ. |
| Sufficient Contrast | ✍️ Có | Test `theme.test.ts` kiểm tương phản chữ ≥ 4.5:1. |
| Reduced Motion | ✍️ Có | Theo cài đặt hệ thống, và có công tắc riêng trong app. |
| Larger Text | ⟨kiểm trước khi khai⟩ | Chữ có giãn theo cỡ chữ hệ thống (có giới hạn). Nên thử ở cỡ AX lớn nhất trên máy thật. |
| VoiceOver | ⟨kiểm trước khi khai⟩ | Có nhãn và thông báo cho bàn cờ và các nước đi, nhưng **chưa đi thử toàn bộ bằng VoiceOver**. |
| Voice Control | ⟨kiểm trước khi khai⟩ | Nút có nhãn; chơi bằng Voice Control cần bật bàn phím mũi tên. Chưa thử. |
| Captions · Audio Descriptions | Không áp dụng | App không có nội dung video hay lời thoại. |

## 9. App Review Information

| Mục | Giá trị | |
|---|---|---|
| Họ tên liên hệ | ⟨…⟩ | ⟨…⟩ |
| Email | ⟨…⟩ | ⟨…⟩ |
| Số điện thoại | ⟨định dạng quốc tế, vd. +84 9xx xxx xxx⟩ | ⟨…⟩ |
| Sign-in required | **No**: không có tài khoản. | ✅ |
| Attachment | Không cần. | ✅ |

<!-- field: reviewNotes | max 4000 bytes -->
```text
Auryn is a single-player 2048-style puzzle. No account, network connection, purchases or ads.

Quick tour:
- Home > Play starts a run. Swipe on the board to move tiles; equal tiles merge.
- Undo (bottom-left) takes back the last move only (single step).
- Reaching 2048 shows a milestone screen; "Keep climbing" continues the same board.
- Records shows lifetime stats; Settings has sound, haptics, reduced motion, arrow pad and language (English / Vietnamese).
- Progress is saved on the device; relaunching resumes the current run.

All data stays on the device (AsyncStorage). The app requests no permissions.
```

## 10. Export compliance và build

| Mục | Giá trị | |
|---|---|---|
| Encryption | `ITSAppUsesNonExemptEncryption = NO` (`app.json` → `usesNonExemptEncryption: false`). App không dùng mã hoá ngoài mức được miễn trừ, nên App Store Connect sẽ không hỏi lại. | ✅ |
| Build production | `pnpm build:ios`, tức `eas build --platform ios --profile production` | ✅ |
| Gửi build lên App Store Connect | `npx eas-cli@latest submit --platform ios --profile production` (cần `ascAppId` ở mục 1) | ✅ |
| TestFlight | ⟨đã cài bản production qua TestFlight và chơi thử trên máy thật? ngày⟩ | ⟨…⟩ |

## 11. Checklist trước khi bấm "Add for Review"

- [x] Privacy Policy URL và Support URL đã mở được, không cần đăng nhập (kiểm tra 2026-10-26: 6 trang trả 200, không bị Deployment Protection chặn).
- [ ] Tên app được App Store Connect chấp nhận (không trùng).
- [ ] `node store/check-metadata.mjs` không báo lỗi.
- [ ] Bản production cài qua TestFlight chạy trên **iPhone thật và iPad**:
  - vuốt mượt;
  - âm thanh tôn trọng nút gạt im lặng;
  - mở lại app thì vẫn chơi tiếp được ván cũ.
- [ ] Đã xác nhận đường dẫn dev `/dev` **không hoạt động** trong bản production (nó tự chuyển về Home khi `__DEV__` là false).
- [ ] Đã upload đủ 8 ảnh × 2 ngôn ngữ cho iPhone 6.9" và iPad 13", đúng thứ tự 01→08.
- [ ] App Preview: đã đặt poster frame (mục 7).
- [ ] Age rating ra 4+; App Privacy là "Data Not Collected".
- [ ] DSA trader status đã khai, hoặc đã bỏ EU khỏi Availability.
- [ ] Đã chọn build ở phần "Build" của version 1.0.0.
- [ ] Release: Manual.

---

## Phụ lục A: bản nháp Privacy Policy (đăng ở một URL công khai)

```text
Auryn — Privacy Policy
Last updated: ⟨date⟩

Auryn is a single-player puzzle game made by ⟨your name or company⟩.

Data we collect: none. Auryn does not collect, store on any server, share or sell personal
information. The app has no account, no analytics, no advertising and makes no network requests.

Data on your device: your current game, statistics and settings are saved only on your device
so you can continue later. Deleting the app removes them.

Permissions: Auryn does not request access to your camera, microphone, location, contacts or photos.

Children: the app is suitable for all ages and collects no data from anyone, including children.

Changes: if this ever changes, we will update this page and the App Store privacy details first.

Contact: ⟨email⟩
```

## Phụ lục B: những điểm tôi chưa xác minh

- Tên "Auryn" còn trống trên App Store hay không.
- Chưa đi thử app bằng VoiceOver, Voice Control hay cỡ chữ lớn nhất, nên mục 8 để bạn quyết định.
- Chưa chạy bản build production / TestFlight trên máy thật. Mọi capture đều từ simulator, bản debug.
- Thuế, ngân hàng, Paid Apps Agreement: app miễn phí nên không cần Paid Apps Agreement, nhưng tài khoản phải đồng ý Apple Developer Program License Agreement mới nhất.
