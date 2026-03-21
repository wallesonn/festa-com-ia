export function AvatarDefault({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Avatar padrão"
    >
      <circle cx="20" cy="20" r="20" fill="#9CA3AF" />
      <circle cx="20" cy="15" r="7" fill="#F3F4F6" />
      <ellipse cx="20" cy="34" rx="12" ry="9" fill="#F3F4F6" />
    </svg>
  )
}
