#!/bin/sh
set -eu

config_file="/app/config/env"

if [ ! -f "$config_file" ]; then
    cp /app/.env.example "$config_file"
    jwt_secret="$(head -c 48 /dev/urandom | base64 | tr -d '\n')"
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" "$config_file"
    echo "已创建默认配置文件 /app/config/env，并生成随机 JWT 密钥"
fi

ln -sf "$config_file" /app/.env

nginx
exec node backend/dist/app.js
