# voting-dapp

Bầu chọn môn học tự chọn nội bộ với 3 lựa chọn:
- An toàn web
- Phân tích mã độc
- Dịch vụ đám mây

## Tính năng

- Danh sách cử tri được ủy quyền (whitelist): chỉ owner mới thêm được địa chỉ được phép bầu.
- Hỗ trợ hiển thị kết quả trực quan bằng biểu đồ trong frontend (Chart.js, Recharts) dựa trên số phiếu.
- Lịch sử giao dịch: đọc sự kiện `VoteCast` từ blockchain để lấy transaction hash, block number và thời gian.

## Cài đặt

```bash
npm install
```

## Chạy test

```bash
npm test
```

## Front-end (3.3)

Giao diện đã được triển khai tại `frontend/index.html` với:
- tiêu đề `Election Results`
- bảng kết quả gồm 3 cột: `#`, `Name`, `Votes`
- dropdown chọn ứng viên và nút `Vote`
- hiển thị địa chỉ ví hiện tại
- trạng thái loading khi gọi contract
- lắng nghe event `votedEvent` để cập nhật tự động
- thông báo lỗi thân thiện khi giao dịch bị từ chối hoặc thiếu gas

### Chạy giao diện

1. Deploy contract lên mạng `localhost` như hướng dẫn bên dưới.
2. Chạy một server tĩnh trong thư mục `frontend`:

```bash
cd frontend
python3 -m http.server 8080
```

3. Mở trình duyệt đến:

```bash
http://127.0.0.1:8080
```

4. Kết nối MetaMask với mạng local (RPC `http://127.0.0.1:8545`, chainId `31337`).
5. Dán địa chỉ contract và nhấn `Load contract`.

## Tình trạng 3.1

Các yêu cầu 3.1 hiện tại:
- Solidity 0.8.x: đã sử dụng `pragma solidity ^0.8.0`.
- Hardhat: đã có `hardhat.config.js` và tests chạy bằng Hardhat.
- Local blockchain: sử dụng Hardhat node thay cho Ganache, là local blockchain hợp lệ cho dự án.
- MetaMask: front-end đã hỗ trợ kết nối MetaMask.
- Ethers.js v6: front-end dùng Ethers.js v6 qua CDN.
- Front-end HTML/CSS/JS: đã triển khai giao diện tĩnh tại `frontend`.
- Mocha + Chai: test hiện có `test/Election.js`.
- Git + GitHub: repo đang có cấu trúc chuẩn.

Một số lưu ý:
- Nếu đề bài yêu cầu bắt buộc Ganache, repo hiện dùng Hardhat node thay thế.

## Lịch sử bỏ phiếu

1. Khởi động node Hardhat:

```bash
npx hardhat node
```

2. Mở terminal khác và deploy contract lên mạng `localhost`:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Sao chép địa chỉ contract in ra từ lệnh deploy, ví dụ:

```bash
Election deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

4. Chạy script đọc lịch sử vote với biến môi trường `CONTRACT_ADDRESS`:

```bash
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 npx hardhat run scripts/getVoteHistory.js --network localhost
```

### Notes

- `scripts/deploy.js` sẽ deploy contract và in ra địa chỉ contract.
- `scripts/getVoteHistory.js` sẽ đọc các sự kiện `VoteCast` từ blockchain và hiển thị:
  - `txHash`
  - `voter`
  - `candidateId`
  - `timestamp`
  - `blockNumber`
  - `datetime`

## Ghi chú

- Contract: `contracts/Election.sol`
- Test: `test/Election.js`
- Script lịch sử giao dịch: `scripts/getVoteHistory.js`
