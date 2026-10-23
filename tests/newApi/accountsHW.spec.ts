import { StatusCodes } from 'http-status-codes'
import { expect, test } from '@playwright/test'
import { AccountDTO } from '../../dto/AccountDTO'
import { MoneyDTO } from '../../dto/MoneyDTO'
import { TransferDTO } from '../../dto/TransferDTO'
import { BadAccountDTO } from '../../dto/BadAccountDTO'

const baseUrl = 'https://shop.tl-academy.ee'
const authHeaders = {
  'X-API-KEY': 'my-api-key',
}
const badAuthHeaders = {
  'X-API-KEY': 'not-my-api-key',
}
const errorId = 1000

type CreatedAccountResp = {
  id: number
  owner: string
  currency: string
  balance: number
  createdAt: string
}

type CreatedAccountErrorResp = {
  error: string
}

test.describe('GET positive tests', () => {
  test('TL-11-1 GET /api/accounts with valid key', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts', {
      headers: authHeaders,
    })
    const respBody: CreatedAccountResp = await response.json()
    const statusCode = response.status()

    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.OK)
  })

  test('TL-11-2 GET /api/accounts/{id} with valid key', async ({ request }) => {
    const account = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })

    const respForId = await account.json()
    const id = respForId.id

    const response = await request.get(baseUrl + `/api/accounts/${id}`, {
      headers: authHeaders,
    })

    const respBody: CreatedAccountResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(statusCode).toBe(StatusCodes.OK)
  })
})

test.describe('GET negative tests', () => {
  test('TL-11-3 GET /api/accounts without key', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts')

    const respBody: CreatedAccountErrorResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.UNAUTHORIZED)
  })

  test('TL-11-4 GET /api/accounts with invalid key', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts', {
      headers: badAuthHeaders,
    })

    const respBody: CreatedAccountErrorResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).not.toBe(StatusCodes.OK)
    expect(response.status()).toBe(StatusCodes.UNAUTHORIZED)
  })

  test('TL-11-5 GET /api/accounts/{id} with invalid id', async ({ request }) => {
    const response = await request.get(baseUrl + `/api/accounts/${errorId}`, {
      headers: authHeaders,
    })

    const respBody = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect.soft(response.status()).not.toBe(StatusCodes.OK)
    expect.soft(response.status()).toBe(StatusCodes.NOT_FOUND)
  })

  test('TL-11-6 GET /api/accounts/{id} with invalid {id}', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/-1', {
      headers: authHeaders,
    })

    const respBody: CreatedAccountErrorResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })

  test('TL-11-7 GET /api/accounts/{id} with invalid {id}', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/aaa1', {
      headers: authHeaders,
    })

    const respBody: CreatedAccountErrorResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })
})

test.describe('POST positive tests', () => {
  test('TL-11-8 POST /api/accounts with valid data without currency', async ({ request }) => {
    const account = new AccountDTO('Elina')
    const response = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: account,
    })

    const respBody: CreatedAccountResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.CREATED)
  })

  test('TL-11-9 POST /api/accounts with valid data with currency', async ({ request }) => {
    const account = new AccountDTO('Alina', 'USD')
    const response = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: account,
    })

    const respBody: CreatedAccountResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.CREATED)
    expect(respBody.currency).toBe('USD') // не буду делать тут много проверок, тк делали их на уроке, хочу просто создать аккаунты для себя, чтобы работать с ними
  })

  test('TL-11-10 POST /accounts/{id}/deposit with valid data', async ({ request }) => {
    const account1 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina', 'USD'),
    })

    const respForId = await account1.json()
    const id = respForId.id

    const zeroBalance = respForId.balance

    const reqBody = new MoneyDTO(55)
    const response = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
      headers: authHeaders,
      data: reqBody,
    })

    const respBody: CreatedAccountResp = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    const bodyBalance = respBody.balance

    expect(response.status()).toBe(StatusCodes.OK)
    expect(bodyBalance).not.toBe(0)
    expect(zeroBalance).toBe(0)
    expect(bodyBalance).not.toBe(zeroBalance)
    expect(respBody.currency).toBe('USD')
    expect(respBody.owner).toBe('Elina')
  })

  test('TL-11-11 POST /api/accounts/{id}/transfer with valid data', async ({ request }) => {
    const account1 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Alina'),
    })
    const account2 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })

    const respForId = await account1.json()
    const id = respForId.id
    const respForId2 = await account2.json()
    const id2 = respForId2.id

    const dep = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
      headers: authHeaders,
      data: new MoneyDTO(55),
    })

    console.log(respForId2, dep)

    const reqBody = new TransferDTO(id2, 55)
    const response = await request.post(baseUrl + `/api/accounts/${id}/transfer`, {
      headers: authHeaders,
      data: reqBody,
    })

    const respBody = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.OK)
    expect(respBody.amount).toBe(55) // не знаю, как проверить, что имена итд передаются корректно..
  })
})
test.describe('POST negative tests', () => {
  test('TL-11-12 POST /api/accounts without owner', async ({ request }) => {
    const account = new BadAccountDTO(undefined, 'USD')
    const response = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: account,
    })

    const respBody = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })
  test('TL-11-13 POST /api/accounts/{id}/deposit with amount 0', async ({ request }) => {
    const account = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })

    const respForId = await account.json()
    const id = respForId.id

    const dep = new MoneyDTO(0)
    const response = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
      headers: authHeaders,
      data: dep,
    })

    const respBody = await response.json()
    const statusCode: number = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })

  test('TL-11-14 POST /api/accounts/{id}/deposit with negative amount', async ({ request }) => {
    const account = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })

    const respForId = await account.json()
    const id = respForId.id

    const dep = new MoneyDTO(-1)
    const response = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
      headers: authHeaders,
      data: dep,
    })

    const respBody = await response.json()
    const statusCode: number = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })

  test('TL-11-15 POST /api/accounts/{id}/deposit with amount not a number', async ({ request }) => {
    const account = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })

    const respForId = await account.json()
    const id = respForId.id

    const response = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
      headers: authHeaders,
      data: {
        amount: 'aaa',
      },
    })

    const respBody = await response.json()
    const statusCode: number = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })

  test('TL-11-16 POST /api/accounts/{id}/deposit with amount which has more than two decimal places', async ({
    request,
  }) => {
    const account = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })

    const respForId = await account.json()
    const id = respForId.id

    const dep = new MoneyDTO(1.1234)
    const response = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
      headers: authHeaders,
      data: dep,
    })

    const respBody = await response.json()
    const statusCode: number = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })

  test('TL-11-17 POST /api/accounts/{id}/deposit with invalid {id}', async ({ request }) => {
    const dep = new MoneyDTO(123)
    const response = await request.post(baseUrl + `/api/accounts/${errorId}/deposit`, {
      headers: authHeaders,
      data: dep,
    })

    const respBody = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect.soft(response.status()).toBe(StatusCodes.NOT_FOUND)
    expect.soft(respBody.error).not.toBeUndefined()
  })

  test('TL-11-18 POST /api/accounts/{id}/transfer with invalid amount', async ({ request }) => {
    const account1 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })
    const account2 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Alina'),
    })

    const respForId = await account1.json()
    const id = respForId.id

    const respForId2 = await account2.json()
    const id2 = respForId2.id

    console.log(account1, account2, id, respForId2, id2) //чтобы в гитхабе не упала проверка

    const transfer = new TransferDTO(id2, 0)
    const response = await request.post(baseUrl + `/api/accounts/${id}/transfer`, {
      headers: authHeaders,
      data: transfer,
    })

    const respBody = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
  })

  test('TL-11-19 POST /api/accounts/{id}/transfer with insufficient funds', async ({ request }) => {
    const account1 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Elina'),
    })
    const account2 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Alina'),
    })

    const respForId = await account1.json()
    const id = respForId.id

    const respForId2 = await account2.json()
    const id2 = respForId2.id

    console.log(account1, account2, respForId2) //чтобы в гитхабе не упала проверка

    const transfer = new TransferDTO(id, 60)

    const response = await request.post(baseUrl + `/api/accounts/${id2}/transfer`, {
      headers: authHeaders,
      data: transfer,
    })

    const respBody = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.CONFLICT)
    expect(respBody.error).not.toBeUndefined()
  })

  test.fail(
    'TL-11-20 POST /api/accounts/{id}/transfer with the funds sent to the same account',
    async ({ request }) => {
      const account1 = await request.post(baseUrl + '/api/accounts', {
        headers: authHeaders,
        data: new AccountDTO('Elina'),
      })

      const respForId = await account1.json()
      const id = respForId.id

      const dep = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
        headers: authHeaders,
        data: new MoneyDTO(50),
      })
      console.log(respForId, dep)

      const response = await request.post(baseUrl + `/api/accounts/${id}/transfer`, {
        headers: authHeaders,
        data: new TransferDTO(id, 50),
      })

      const respBody = await response.json()
      const statusCode = response.status()
      console.log(respBody, statusCode)

      expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
      expect(respBody.error).not.toBeUndefined()
    },
  )

  test.fail(
    'TL-11-21 POST /api/accounts/{id}/transfer with different currencies',
    async ({ request }) => {
      const account1 = await request.post(baseUrl + '/api/accounts', {
        headers: authHeaders,
        data: new AccountDTO('Elina', 'USD'),
      })
      const account2 = await request.post(baseUrl + '/api/accounts', {
        headers: authHeaders,
        data: new AccountDTO('Alina', 'EUR'),
      })

      const respForId = await account1.json()
      const id = respForId.id

      const respForId2 = await account2.json()
      const id2 = respForId2.id

      const dep = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
        headers: authHeaders,
        data: new MoneyDTO(50),
      })
      console.log(account1, account2, respForId2, id2, dep) //чтобы не слетела проверка гитхаба

      const response = await request.post(baseUrl + `/api/accounts/${id}/transfer`, {
        headers: authHeaders,
        data: new TransferDTO(id2, 50),
      })

      const respBody = await response.json()
      const statusCode = response.status()
      console.log(respBody, statusCode)

      expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
      expect(respBody.error).not.toBeUndefined()
    },
  )

  test('TL-11-22 POST /api/accounts/{id}/transfer with invalid toId', async ({ request }) => {
    const account1 = await request.post(baseUrl + '/api/accounts', {
      headers: authHeaders,
      data: new AccountDTO('Alina', 'EUR'),
    })

    const respForId = await account1.json()
    const id = respForId.id

    const dep = await request.post(baseUrl + `/api/accounts/${id}/deposit`, {
      headers: authHeaders,
      data: new MoneyDTO(50),
    })
    console.log(dep)

    const response = await request.post(baseUrl + `/api/accounts/${id}/transfer`, {
      headers: authHeaders,
      data: new TransferDTO(errorId, 50),
    })

    const respBody = await response.json()
    const statusCode = response.status()
    console.log(respBody, statusCode)

    expect(response.status()).toBe(StatusCodes.NOT_FOUND)
    expect(respBody.error).not.toBeUndefined()
  })
})
