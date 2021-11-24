module.exports = {
  devServer: {
    // https: true,
    // disableHostCheck: true,
  },
  chainWebpack: config => {
    config.resolve.alias.set("vue", "@vue/compat");

    config.module
      .rule("vue")
      .use("vue-loader")
      .tap(options => {
        // Vue 2 > Vue 3 compatibility mode
        return {
          ...options,
          compilerOptions: {
            compatConfig: {
              // default everything to Vue 2 behavior
              MODE: 2
            }
          }
        };
      });
    },
    configureWebpack: {
      devtool: 'source-map'
    }
};
