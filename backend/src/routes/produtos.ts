import { Router } from 'express'
import * as controller from 'controllers/produto.controller'

const router = Router()

router.get('/', controller.listarTodos)
router.get('/:id', controller.buscarPorId)
router.post('/', controller.criar)
router.put('/:id', controller.atualizar)
router.delete('/:id', controller.deletar)

export default router
