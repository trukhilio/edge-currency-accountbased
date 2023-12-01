export default [
  {
    pluginId: 'ethereum',
    WALLET_TYPE: 'wallet:ethereum',
    'Test Currency code': 'ETH',
    key: [
      39, 190, 34, 129, 208, 32, 145, 88, 191, 217, 226, 98, 183, 16, 52, 150,
      52, 53, 31, 137, 164, 40, 236, 146, 128, 107, 129, 59, 192, 240, 40, 238
    ],
    mnemonic:
      'room soda device label bicycle hill fork nest lion knee purpose hen',
    xpub: '0x21D45Fd06e291C49AbFa135460DE827b6579Cef5',
    key_length: 64,
    'invalid key name': {
      type: 'wallet:ethereum',
      keys: { ethereumKeyz: '12345678abcd' }
    },
    'invalid wallet type': {
      type: 'shitcoin',
      keys: { ethereumKey: '12345678abcd' }
    },
    parseUri: {
      'address only': [
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8'
      ],
      'address with provided currency code': {
        args: ['0x04b6b3bcbc16a5fb6a20301d650f8def513122a8', 'USDC'],
        output: {
          publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8'
        }
      },
      'checksum address only': [
        '0x3C40cbb7F82A7E1bc83C4E3E98590b19e0e1bf07',
        '0x3c40cbb7f82a7e1bc83c4e3e98590b19e0e1bf07'
      ],
      'invalid checksum address only': [
        '0x3C40cbb7F82A7E1bc83C4E3E98590b19e0e1Bf07'
      ],
      'invalid address': [
        '0x466d506cd7fbcd29a06015da03f0de814df050ez',
        '0466d506cd7fbcd29a06015da03f0de814df050ee',
        '0x466d506cd7fbcd29a06015da03f0de814df050ee1'
      ],
      'uri address': [
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8'
      ],
      'uri address with amount': [
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?amount=12345.6789',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        '12345678900000000000000',
        'ETH'
      ],
      'uri address with unique identifier': [
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?dt=123456789',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        'ETH'
      ],
      'uri address with unique identifier and without network prefix': [
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?dt=123456789',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        'ETH'
      ],
      'uri address with amount & label': [
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?amount=1234.56789&label=Johnny%20Ripple',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        '1234567890000000000000',
        'ETH',
        'Johnny Ripple'
      ],
      'uri address with amount, label & message': [
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?amount=1234.56789&label=Johnny%20Ripple&message=Hello%20World,%20I%20miss%20you%20!',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        '1234567890000000000000',
        'ETH',
        'Johnny Ripple',
        'Hello World, I miss you !'
      ],
      'uri address with unsupported param': [
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?unsupported=helloworld&amount=12345.6789',
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
        '12345678900000000000000',
        'ETH'
      ],
      'uri eip681 payment address': {
        args: ['ethereum:0xf5d81254c269a1e984044e4d542adc07bf18c541?value=123'],
        output: {
          publicAddress: '0xf5d81254c269a1e984044e4d542adc07bf18c541',
          nativeAmount: '123'
        }
      },
      'uri eip681 payment address with pay prefix': {
        args: [
          'ethereum:pay-0xf5d81254c269a1e984044e4d542adc07bf18c541?value=123'
        ],
        output: {
          publicAddress: '0xf5d81254c269a1e984044e4d542adc07bf18c541',
          nativeAmount: '123'
        }
      },
      'uri eip681 payment address using scientific notation': {
        args: [
          'ethereum:0xf5d81254c269a1e984044e4d542adc07bf18c541?value=2.014e18'
        ],
        output: {
          publicAddress: '0xf5d81254c269a1e984044e4d542adc07bf18c541',
          nativeAmount: '2014000000000000000'
        }
      },
      'uri eip681 transfer contract invocation': {
        args: [
          'ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/transfer?address=0xf5d81254c269a1e984044e4d542adc07bf18c541&uint256=2.014e6',
          'USDC'
        ],
        output: {
          publicAddress: '0xf5d81254c269a1e984044e4d542adc07bf18c541',
          nativeAmount: '2014000',
          currencyCode: 'USDC'
        }
      },
      'RenBrige Gateway uri address': {
        args: ['ethereum://0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
        output: {
          publicAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          metadata: {
            gateway: true
          }
        }
      },
      'RenBrige Gateway uri address with amount, label & message': {
        args: [
          'ethereum://0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48?amount=12345.6789&label=Johnny%20Ethereum&message=Hello%20World,%20I%20miss%20you%20!'
        ],
        output: {
          publicAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          metadata: {
            name: 'Johnny Ethereum',
            notes: 'Hello World, I miss you !',
            gateway: true
          },
          nativeAmount: '12345678900000000000000',
          currencyCode: 'ETH'
        }
      }
    },
    encodeUri: {
      'address only': [
        { publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8' },
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8'
      ],
      'weird address': [
        { publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8' },
        '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8'
      ],
      'invalid address': [
        { publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122az' },
        { publicAddress: '04b6b3bcbc16a5fb6a20301d650f8def513122a8' },
        { publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8a' }
      ],
      'address & amount': [
        {
          publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
          nativeAmount: '123456780000'
        },
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?amount=0.00000012345678'
      ],
      'address, amount, and label': [
        {
          publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
          nativeAmount: '123000000000000',
          currencyCode: 'ETH',
          label: 'Johnny Ether'
        },
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?amount=0.000123&label=Johnny%20Ether'
      ],
      'address, amount, label, & message': [
        {
          publicAddress: '0x04b6b3bcbc16a5fb6a20301d650f8def513122a8',
          nativeAmount: '123000000000000',
          currencyCode: 'ETH',
          label: 'Johnny Ether',
          message: 'Hello World, I miss you !'
        },
        'ethereum:0x04b6b3bcbc16a5fb6a20301d650f8def513122a8?amount=0.000123&label=Johnny%20Ether&message=Hello%20World,%20I%20miss%20you%20!'
      ]
    }
  },
  {
    pluginId: 'fio',
    WALLET_TYPE: 'wallet:fio',
    'Test Currency code': 'FIO',
    key: [
      39, 190, 34, 129, 208, 32, 145, 88, 191, 217, 226, 98, 183, 16, 52, 150,
      52, 53, 31, 137, 164, 40, 236, 146, 128, 107, 129, 59, 192, 240, 40, 238
    ],
    xpub: 'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
    key_length: 51,
    'invalid key name': {
      type: 'wallet:fio',
      keys: {
        fioKeyz: '5KG4yxR4j1S1UFk4mGraAfGrWh7TS5uiJmhtkG4vPunFWg84wuP',
        mnemonic:
          'chicken valve parrot park animal proof youth detail glance review artwork cluster drive more charge lunar uncle neglect brain act rose job photo spot'
      }
    },
    'invalid wallet type': {
      type: 'wallet:fiox',
      keys: { fiokey: '5KG4yxR4j1S1UFk4mGraAfGrWh7TS5uiJmhtkG4vPunFWg84wuP' }
    },
    parseUri: {
      'address only': [
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'invalid address': [
        'FIOHWCM6NMEVYZKLPJBS45H5OFRVUO4KOIVBIGWZEPMZUOTHBGOL',
        'GDUHWCM6NMEVYZKLPJBS45H5OFRVUO4KOIVBIGWZEPMZUOTHBGOL5FAD',
        'GDUHWCM6NMEVYZKLPJBS45H5OFRVUO4KOIVBIGWZEPMZUOTHBGOL5'
      ],
      'uri address': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'uri address with amount': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=12345.6789',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '12345678900000',
        'FIO'
      ],
      'uri address with unique identifier': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?memo=123456789&memo_type=MEMO_ID',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO'
      ],
      'uri address with unique identifier and without network prefix': [
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?memo=123456789&memo_type=MEMO_ID',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO'
      ],
      'uri address with amount & label': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=1234.56789&label=Johnny%20Ripple',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '1234567890000',
        'FIO',
        'Johnny Ripple'
      ],
      'uri address with amount, label & message': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=1234.56789&label=Johnny%20Ripple&msg=Hello%20World,%20I%20miss%20you%20!',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '1234567890000',
        'FIO',
        'Johnny Ripple',
        'Hello World, I miss you !'
      ],
      'uri address with unsupported param': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?unsupported=helloworld&amount=12345.6789',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '12345678900000',
        'FIO'
      ]
    },
    encodeUri: {
      'address only': [
        {
          publicAddress: 'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
        },
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'weird address': [
        {
          publicAddress: 'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
        },
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'invalid address': [
        { publicAddress: 'rf1GeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn' },
        { publicAddress: 'sf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn' },
        { publicAddress: 'rf1BiGeXwwQol8Z2ueFYTEXSwuJYfV2Jpn' }
      ],
      'address & amount': [
        {
          publicAddress:
            'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
          nativeAmount: '1234567800000'
        },
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=1234.5678'
      ],
      'address, amount, and label': [
        {
          publicAddress:
            'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
          nativeAmount: '1230',
          currencyCode: 'FIO',
          label: 'Johnny Ripple'
        },
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=0.00000123&label=Johnny%20Ripple'
      ],
      'address, amount, label, & message': [
        {
          publicAddress:
            'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
          nativeAmount: '1230',
          currencyCode: 'FIO',
          label: 'Johnny Ripple',
          message: 'Hello World, I miss you !'
        },
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=0.00000123&label=Johnny%20Ripple&message=Hello%20World,%20I%20miss%20you%20!'
      ]
    }
  }
]
