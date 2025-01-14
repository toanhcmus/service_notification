# Sử dụng Node.js base image
FROM node:16

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json để cài đặt dependencies
COPY package*.json ./


# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Mở cổng cho server
EXPOSE 3100

# Khởi chạy ứng dụng
CMD ["node", "server.js"]
