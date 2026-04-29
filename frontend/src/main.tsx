import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp } from 'antd'
import './index.css'
import App from './App'
import { installDisplayTextNormalizer } from './shared/lib/textNormalizer'

const root = createRoot(document?.getElementById('root')!)

root.render(
  <StrictMode>
    <AntdApp>
      <App />
    </AntdApp>
  </StrictMode>,
)

installDisplayTextNormalizer()
