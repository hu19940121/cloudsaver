import buffer from "buffer";

// 兼容 Node 25+ 移除弃用 SlowBuffer 导致的旧依赖 (如 buffer-equal-constant-time) 报错
if (!(buffer as any).SlowBuffer) {
  (buffer as any).SlowBuffer = buffer.Buffer;
}
