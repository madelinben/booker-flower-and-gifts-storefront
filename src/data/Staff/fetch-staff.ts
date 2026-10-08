import { createServerFn } from '@tanstack/react-start';
import { getCurrentStaff } from '~/services/auth/current-staff';

export const fetchStaff = createServerFn({ method: 'GET' }).handler(() => getCurrentStaff());
