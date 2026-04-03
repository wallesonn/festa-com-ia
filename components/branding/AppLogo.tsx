import Image from 'next/image'
import Link from 'next/link'

const LOGO_SOURCES = {
  transparent: '/logo_fundo_transparente.png',
  white: '/logo_fundo_branco.png',
} as const

type AppLogoProps = {
  variant: keyof typeof LOGO_SOURCES
  size?: number
  href?: string
  label?: string
  className?: string
  labelClassName?: string
  priority?: boolean
}

export function AppLogo({
  variant,
  size = 40,
  href,
  label,
  className = '',
  labelClassName = '',
  priority = false,
}: AppLogoProps) {
  const content = (
    <>
      <Image
        src={LOGO_SOURCES[variant]}
        alt={label ?? 'Festa com IA'}
        width={size}
        height={size}
        priority={priority}
        className="block shrink-0"
      />
      {label ? <span className={labelClassName}>{label}</span> : null}
    </>
  )

  const baseClassName = `inline-flex items-center gap-3 ${className}`.trim()

  if (href) {
    return (
      <Link href={href} className={baseClassName} aria-label={label ?? 'Festa com IA'}>
        {content}
      </Link>
    )
  }

  return <div className={baseClassName}>{content}</div>
}
