#!/bin/sh
set -eu

config_file="/app/config/env"

if [ ! -f "$config_file" ]; then
    cp /app/.env.example "$config_file"
    jwt_secret="$(head -c 48 /dev/urandom | base64 | tr -d '\n')"
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" "$config_file"
    echo "已创建默认配置文件 /app/config/env，并生成随机 JWT 密钥"
fi

ensure_random_setting() {
    setting_name="$1"
    current_value="$(sed -n "s/^${setting_name}=//p" "$config_file" | head -n 1)"
    if [ "${#current_value}" -lt 16 ]; then
        random_value="$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"
        if grep -q "^${setting_name}=" "$config_file"; then
            sed -i "s|^${setting_name}=.*|${setting_name}=${random_value}|" "$config_file"
        else
            printf '\n%s=%s\n' "$setting_name" "$random_value" >> "$config_file"
        fi
        echo "已生成安全的 ${setting_name}"
    fi
}

ensure_random_setting "ADMIN_REGISTRATION_CODE"
ensure_random_setting "COMMON_REGISTRATION_CODE"

ln -sf "$config_file" /app/.env

nginx
exec node backend/dist/app.js
