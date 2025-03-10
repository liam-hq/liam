import type React from 'react'
import { Form } from './Form'
import styles from './NewProjectPage.module.css'

export const NewProjectPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Form />
    </div>
  )
}
