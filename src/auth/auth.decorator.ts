import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common'
import { AdminGuard } from './auth.guads'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const Admin = () => applyDecorators(UseGuards(AdminGuard))
