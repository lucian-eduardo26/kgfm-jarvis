import { exigirSessao } from '@/lib/guarda'
import { Moldura } from '@/components/Moldura'
import { Conversa } from '@/components/Conversa'
import { falarComJarvis } from '../acoes'

export const dynamic = 'force-dynamic'

export default async function PaginaConversa() {
  await exigirSessao()
  return (
    <Moldura titulo="Conversa" atalhoAtivo="/conversa">
      <Conversa responderAcao={falarComJarvis} />
    </Moldura>
  )
}
