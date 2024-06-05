const me = {
  name: 'Wil Nichols',
  email: 'hi@wilnichols.design'
}

const meta = {
  lang: 'en',
  url: 'https://wilnichols.com',
  description: 'Personal website of multidisciplinary designer Wil Nichols',
  contact: {
    name: me.name,
    email: me.email
  },
  title: {
    base: me.name,
    separator: ' | '
  }
}

module.exports = {
  ...me,
  ...meta
}