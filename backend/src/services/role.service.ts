import type { RoleItem } from '../dto/role.dto.js';
import { roleRepository } from '../repositories/role.repository.js';

export const roleService = {
  list(): Promise<RoleItem[]> {
    return roleRepository.listActive();
  },
};
