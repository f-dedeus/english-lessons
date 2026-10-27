import { importPlacementTest } from '../placement/import.ts'
import { pool } from './client.ts'

importPlacementTest()
  .then((total) => console.log(`Placement test imported: ${total} questions.`))
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())