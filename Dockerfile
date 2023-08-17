# 指定基础镜像
FROM node:14

# 安装项目所需的依赖
COPY package*.json ./
RUN npm install

# 复制项目文件到镜像中
COPY . .

# 指定容器启动时要运行的命令
CMD ["node", "app1.js"]
