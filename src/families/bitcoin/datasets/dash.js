// @flow
import type { CurrenciesData } from "../../../__tests__/test-helpers/bridge";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "dash seed 1",
      apdus: `
      => e040000009028000002c80000005
      <= 410499636d9229e2719130b1bdd4cf05f49b8528ab3a1945e8d168f29273762c404627912d9c847d38e06133dbe864949820be52ff428051990958afd5d3be0d0115225874546e314a6674454b51717932677a51476e357737534479556d71705a424179650430eee93ea2065bf8d5f83d32c7d968a56c50b94901abb2a1d81d09a63f22609000
      => e016000000
      <= 004c001001084461726b436f696e04444153489000
      => e040000009028000002c80000005
      <= 410499636d9229e2719130b1bdd4cf05f49b8528ab3a1945e8d168f29273762c404627912d9c847d38e06133dbe864949820be52ff428051990958afd5d3be0d0115225874546e314a6674454b51717932677a51476e357737534479556d71705a424179650430eee93ea2065bf8d5f83d32c7d968a56c50b94901abb2a1d81d09a63f22609000
      => e04000000d038000002c8000000580000000
      <= 4104b86738cee704df2efcbe8da0c8021dd8bff53a2b95a4f5ca586cd8b26af2e79f7be8cb35b62bad7560807414d8e80363f917d1c3cd6d5d10f8c8df347a463c5c22586978506f7436554b4b47394c725572516f347879645069725a6845547a38385232d13b75c7488292ea34d9964ae3bb2a71e065bb16cba41602fb956a4f520927979000
      => e04000000d038000002c8000000580000001
      <= 4104503b0cab190ccfe431c62ad07509c20496778526bad9be78d06365af5ec2d1d8aec4bbbba822e50ed9877bdd1e7d83fb9f6fafa2f2e6710d4e226a4d6ffcded3225875374b54635436473752785256636a42754d734c6b6f57616e6844394d32535442ed5ae49e68cc4f958ebcc058e55d1d15f752e1c237275439b88559e2b4e4003f9000
      => e04000000d038000002c8000000580000002
      <= 4104a600fcf73deb64a49e03dfb9699613a865dcba9869021db3ef95510f35934a72ce276d7f61bee70bcf9120a6c3413dfef2814d44fd8b3482615ebb51c638860622587074335446366e58347273547646534736674e353478574e37527731754246333718c14ed85baa61be65f2d78e6d832523157c23bf938dd50fd392e790bc0d112b9000
      `
    }
  ]
};

export default dataset;
