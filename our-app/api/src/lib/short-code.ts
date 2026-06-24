import * as crypto from 'node:crypto'

const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 6

export function generateShortCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH)
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += BASE62[bytes[i] % 62]
  }
  return code
}
