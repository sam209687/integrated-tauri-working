import { App } from '@tinyhttp/app'
import serveStatic from 'serve-static'
import { join } from 'path'

const app = new App()
const distPath = join(__dirname, '../.next')

app.use(serveStatic(distPath))

app.listen(5173, () => {
  console.log('Static Next.js server running on http://localhost:5173')
})
