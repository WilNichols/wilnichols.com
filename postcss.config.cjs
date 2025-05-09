module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-combine-duplicated-selectors'),
    require('cssnano')({ 
      preset: [ 
        require('cssnano-preset-default'),
        { convertValues: false } 
      ]
    }),
  ],
}
