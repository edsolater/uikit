import { injectGlobal } from '@emotion/css'

export function injectGlobalResetStyle() {
  return injectGlobal`
    html,
    body,
    #root {
      height: 100%;
    }
    body {
      margin: 0
    }
    :root {
      font-size: 16px;
    }
    * {
      box-sizing: border-box;
      cursor: default;
    }

    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover {
      text-decoration: unset;
    }
    :where(:is([tabindex], button):focus-visible) {
      outline: 2px solid rgba(204, 204, 204, 0.3);
      outline-offset: 2px;
      border-radius: 1px;
    }
    input {
      font-weight: inherit;
    }
    input[type='number']::-webkit-outer-spin-button,
    input[type='number']::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    /* Firefox */
    input[type='number'] {
      -moz-appearance: textfield;
    }

    @media (min-width: 1000px) {
      ::-webkit-scrollbar {
        background-color: transparent;
        width: 7px;
        height: 7px;
      }
      ::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
      }
    }
    
    button,
    a {
      cursor: pointer;
    }
    input {
      cursor: text;
    }
  `
}
