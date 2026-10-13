import { type ListUsersQuery, type ListUsersResponse, toUserListItem } from '../dto/user.dto.js';
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
};
