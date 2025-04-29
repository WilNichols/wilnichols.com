export default function () {
  const me = {
    name: 'Wil Nichols-Higgins',
    jobTitle: 'Director of Design at <a href="https://www.zello.com" target="blank">Zello</a>',
    email: 'hi@wilnichols.design'
  }
  
  const meta = {
    lang: 'en',
    url: 'https://wilnichols.com/',
    description: 'Personal website of multidisciplinary designer Wil Nichols-Higgins',
    contact: {
      name: me.name,
      email: me.email
    },
    title: {
      base: me.name,
      separator: ' | '
    }
  }
  return {
    ...me,
    ...meta
  }
}