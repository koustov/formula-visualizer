import React from 'react'

import { FormulaVisualizer } from 'formula-visualizer'
import 'formula-visualizer/dist/index.css'
import { numberRange } from 'array-initializer'
const formula = '((a^2)-((x)^2))^0.5'
const App = () => {
  return (
    <div className='container'>
      <div className='header'>
        <h1>Form Visualizer</h1>
        <h4>Current formula: {formula}</h4>
      </div>
      <div className='graph'>
        <FormulaVisualizer
          formula={formula}
          xrange={numberRange(-1000, 1000)}
          parameters={{ a: 400, b: 50 }}
        />
      </div>
    </div>
  )
}

export default App
