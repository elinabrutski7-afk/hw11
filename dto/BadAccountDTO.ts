export class BadAccountDTO {
  owner: string | undefined
  currency: string | undefined

  constructor(owner?: string, currency?: string) {
    this.owner = owner
    this.currency = currency
  }
}
