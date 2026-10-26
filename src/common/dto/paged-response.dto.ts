export class PagedResponseDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;

  constructor(items: T[], page: number, pageSize: number, totalItems: number) {
    this.items = items;
    this.page = page;
    this.pageSize = pageSize;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / pageSize);
  }
}
