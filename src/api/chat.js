import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getChatList = () => {
  return api.get('/chats')
}

export const getChatDetail = (chatId) => {
  return api.get(`/chats/${chatId}`)
}

export const sendMessage = (chatId, content) => {
  return api.post(`/chats/${chatId}/messages`, { content })
}

export const createChat = (title) => {
  return api.post('/chats', { title })
}