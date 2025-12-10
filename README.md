# CryptoPro - Công cụ Mã hóa & Thám mã Chuyên nghiệp

CryptoPro là ứng dụng web hỗ trợ thực hành an toàn mạng, bao gồm các công cụ tự động thám mã cổ điển và thực thi các thuật toán mã hóa hiện đại.

## 🚀 Tính năng chính

### 1. Thám mã Cổ điển (Breakers)

Công cụ tự động tìm khóa và giải mã mà không cần biết khóa trước:

- **Task 1: Caesar Cipher** - Dùng thống kê Chi-Squared & Quadgrams.
- **Task 2: Substitution Cipher (Mã thay thế)** - Dùng thuật toán Hill Climbing với thống kê ngôn ngữ.
- **Task 3: Vigenère Cipher** - Tự động tìm độ dài khóa (dùng chỉ số trùng khớp IC) và khôi phục khóa.

### 2. Mã hóa Hiện đại

Hỗ trợ mã hóa/giải mã chuẩn:

- **Thuật toán**: AES & DES.
- **Chế độ (Mode)**: ECB & CBC (có hỗ trợ IV).
- **Định dạng Input/Output**: Hỗ trợ linh hoạt Text, Hex, và Base64.

## 🌐 Cách sử dụng

Bạn có thể chạy dự án theo 2 cách sau:

### Cách 1: Sử dụng Online (Khuyên dùng)

Truy cập trực tiếp tại đường dẫn: 👉 [https://cryptobyhuyen.vercel.app/](https://cryptobyhuyen.vercel.app/)

### Cách 2: Chạy Local (Trên máy tính)

1. Cài đặt VS Code và Extension **Live Server**.
2. Mở thư mục dự án trong VS Code.
3. Chuột phải vào file `index.html` và chọn **"Open with Live Server"**.

## 📂 Cấu trúc thư mục
```
CryptoPro/
├── index.html
├── english_quadgrams.txt
└── js/
    ├── utils.js
    ├── classic.js
    ├── modern.js
    └── main.js
```

## 🛠️ Công nghệ sử dụng

- HTML5 / JavaScript (ES6+)
- Tailwind CSS (Giao diện)

---

**Lưu ý**: Project phục vụ mục đích học tập và nghiên cứu An toàn mạng.
