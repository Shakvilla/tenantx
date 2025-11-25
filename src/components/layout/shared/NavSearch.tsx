'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

const NavSearch = () => {
  const [searchValue, setSearchValue] = useState('')

  return (
    <TextField
      size='small'
      placeholder='Search for anything here'
      value={searchValue}
      onChange={e => setSearchValue(e.target.value)}
      className='is-[300px]'
      InputProps={{
        startAdornment: (
          <InputAdornment position='start'>
            <IconButton edge='start' size='small' className='text-textSecondary'>
              <i className='ri-search-line' />
            </IconButton>
          </InputAdornment>
        )
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'background.paper',
          borderRadius: '8px'
        }
      }}
    />
  )
}

export default NavSearch

