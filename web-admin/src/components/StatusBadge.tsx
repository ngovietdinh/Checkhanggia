const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  unscanned: { label: 'Chưa quét', className: 'text-text-muted bg-canvas-surface2 border-canvas-border' },
  scanned: { label: 'Đã quét', className: 'text-verify-valid bg-verify-valid/10 border-verify-valid/30' },
  revoked: { label: 'Đã thu hồi', className: 'text-verify-danger bg-verify-danger/10 border-verify-danger/30' },
  valid_first: { label: 'Hợp lệ', className: 'text-verify-valid bg-verify-valid/10 border-verify-valid/30' },
  duplicate: { label: 'Trùng lặp', className: 'text-verify-warn bg-verify-warn/10 border-verify-warn/30' },
  not_found: { label: 'Không tồn tại', className: 'text-verify-danger bg-verify-danger/10 border-verify-danger/30' },
  wrong_secret: { label: 'Sai mã', className: 'text-verify-danger bg-verify-danger/10 border-verify-danger/30' },
  verified: { label: 'Đã xác minh', className: 'text-verify-valid bg-verify-valid/10 border-verify-valid/30' },
  unverified: { label: 'Chưa xác minh', className: 'text-verify-warn bg-verify-warn/10 border-verify-warn/30' },
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: 'text-text-muted bg-canvas-surface2 border-canvas-border',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style.className}`}
    >
      {style.label}
    </span>
  );
}
