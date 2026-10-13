import {
  type CreateUserRequest,
  type ListUsersQuery,
  type ListUsersResponse,
  toUserListItem,
  type UpdateUserRequest,
  type UserListItem,
} from '../dto/user.dto.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { roleRepository } from '../repositories/role.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export const userService = {
  async list({ role, q, page, pageSize }: ListUsersQuery): Promise<ListUsersResponse> {
    const filter = { role, q };
    const total = await userRepository.countActive(filter);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, pageCount);
    const rows = await userRepository.listActive({ ...filter, limit: pageSize, offset: (currentPage - 1) * pageSize });

    return {
      items: rows.map(toUserListItem),
      total,
      page: currentPage,
      pageSize,
      pageCount,
    };
  },

  async create(body: CreateUserRequest): Promise<UserListItem> {
    const fieldErrors: Record<string, string[]> = {};
    if (await userRepository.emailTaken(body.email)) {
      fieldErrors['email'] = ['A user with this email already exists.'];
    }
    if (!(await roleRepository.existsActive(body.roleId))) {
      fieldErrors['roleId'] = ['Choose a role.'];
    }
    if (Object.keys(fieldErrors).length) throw new ValidationError(fieldErrors);

    const id = await userRepository.create(body);
    const row = await userRepository.findListRowById(id);
    if (!row) throw new NotFoundError('User not found');
    return toUserListItem(row);
  },

  async update(id: string, body: UpdateUserRequest): Promise<UserListItem> {
    const user = await userRepository.findActiveById(id);
    if (!user) throw new NotFoundError('User not found');

    const fieldErrors: Record<string, string[]> = {};
    if (body.email !== undefined && (await userRepository.emailTaken(body.email, id))) {
      fieldErrors['email'] = ['A user with this email already exists.'];
    }
    if (body.roleId !== undefined && !(await roleRepository.existsActive(body.roleId))) {
      fieldErrors['roleId'] = ['Choose a role.'];
    }
    if (Object.keys(fieldErrors).length) throw new ValidationError(fieldErrors);

    await userRepository.update(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.roleId !== undefined ? { roleId: body.roleId } : {}),
    });

    const row = await userRepository.findListRowById(id);
    if (!row) throw new NotFoundError('User not found');
    return toUserListItem(row);
  },
};
