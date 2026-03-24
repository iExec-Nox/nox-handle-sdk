import { NETWORK_CONFIGS } from '../../src/config/networks.js';
import type { EIP712TypedData } from '../../src/services/blockchain/IBlockchainService.js';
import type { HexString } from '../../src/types/internalTypes.js';
import type { SolidityType } from '../../src/utils/types.js';

/**
 * Well-known private key for testing purposes
 */
export const TEST_PRIVATE_KEY =
  '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1';
/**
 * Well-known address for testing purposes
 * Derived from TEST_PRIVATE_KEY
 */
export const TEST_ADDRESS = '0x668417616f1502D13EA1f9528F83072A133e8E01';

/**
 * Well-known RSA private key for testing purposes
 */
export const TEST_RSA_PKCS8_PRIV_KEY =
  '0x308204bc020100300d06092a864886f70d0101010500048204a6308204a202010002820101008aef700a189b085baf9b95fe10836c4038a569095932520430973d1c023b9afc5a17c516fd8bb72da554195e74c594c2d3e20e818d3cdf72bbfb29d7b5bc78a3d191e7f2428d2c689d2ffbe49ed3a21c45bfffe8a13e6199a997cfe8ddc590ba4076479f9ac0c8633139d34e361c3b8557a3bb8509979c0e5cb96fcfc86feb4ffc0d112601cf129ee151bce5fc26812d507f3c5a99847f60c337b06a8ce0f5bf2f5dd5e68b2d748e5d600737b2187e38047355679195c3f484c54d41c583805cba0cac7fddbd9c92adf747fccf5640a4318da15a5ca7f28a455d3e2ed3fa27d1d542e1a32a424f43b443382b9a935a4ab763dcbb75a9636dc49959db109b6c13020301000102820100320d99ed2139353526da641ab063508c007c630f79a17dd7c193b2f1d4c2198f817b9fc72d17f929ca2eb6a70765a936d973ceeb10719644b50182ed122db0bec00113317d9573a2cac25f3ad9978007347fbbd7d8c36b111b7eb469fdffafa8d2116ab34ee2d62e9a2ced79f7578b7ff9f76456c5026837ea62ea2bced7b74bc525e793922f61e87d3bc6117ce546332dabb0684805a71e033deb437951ccbe54803aac337af529ce670f302a686f48ceb5175feee148cf2c60e0cb7afff46c4ab8788df4794d865f5f2a34fac5d40641ec73c4a29c442e634f2c80e6be83c05095990d6ff385f0967201e407df4ba052d35db648edde66b0852fe5a608f81d02818100c058d7a13c0f61e36213c939486668e9cb104b15b27a06027c776c336aa3449c009e2b7ed17b89a72836bd24876e094ca938403a13cd7e89f60ff383d4ab4905d4909f100a66a0b3368ecccbae06ec5f5d9c5a998b02c3f390915bb7d4bc735dc19509c1e075c99ae93ee57e2c79e43ba3f98fdb3bf0cebbffb28b60302ba0f702818100b8e9aff130c6e4ef878050fbc5bf0d87b2187a1ea94af6edf9aeadfde92dbc7fc548210ff279e463a8a03e2ef8b7d9c7c3f8c34b3adbf5967a9b089a46b3e385f0e8ed01debe51d210e98d13450c9ddcc0018b2e1bcb2d45075e2a2508ee09e7f4316967704ff7f1e696b3462977ac3e609a1557fc7aebadc644e394df6662c502818049a7bbaaba5d0997110f9296a4ead271f498a0a8065843c4dff4bb32553b80225cfa349db38a2304279a0e83d67884871ea5b3b289b2bf2a0557c6604d27ea2699676801b479e83fb83ca69fb85c5e57867941185aeb0c2e50c5d8e1644d65c01949011b84e095fb042659ab1f4cede108c1a01ccbaf42fb2ac72c28014a33b10281806694d5936330e3ae72286044dc55f9e68e897fade4d2fe9bd488f0634ce99f89ee62ee5c8f72c99df3dd39c20b1ecb4544558bd9ff4429411ab1491b751fb49808a6df5ccb3a1fdffe9be2348f78c956be79dcc16e8fcf845ceb034c5a60dbc3ff372e37411a4bfdb9a35ebf0ca02440d28c884cb0776ca991b583df81f3a5d502818055bcd27b81079b7e8459ecde371138602455cdefeaa43ac0660517ff8a476ec4153f9812e3818574d682a14c07428ceccc2ccde0f8d8800596e98a1f20fc652ef50acf6c08831e8f5850fbacf0adaa56c2859d3cbc7e8f3257f2e16cdd5ba00ec9bb51fb0bdfd3e21cbe8b109adaf59724c55af0ced728d2ee11103d8a014694';
/**
 * Well-known RSA public key for testing purposes
 * Derived from TEST_RSA_PKCS8_PRIV_KEY
 */
export const TEST_RSA_SPKI_PUB_KEY =
  '0x30820122300d06092a864886f70d01010105000382010f003082010a02820101008aef700a189b085baf9b95fe10836c4038a569095932520430973d1c023b9afc5a17c516fd8bb72da554195e74c594c2d3e20e818d3cdf72bbfb29d7b5bc78a3d191e7f2428d2c689d2ffbe49ed3a21c45bfffe8a13e6199a997cfe8ddc590ba4076479f9ac0c8633139d34e361c3b8557a3bb8509979c0e5cb96fcfc86feb4ffc0d112601cf129ee151bce5fc26812d507f3c5a99847f60c337b06a8ce0f5bf2f5dd5e68b2d748e5d600737b2187e38047355679195c3f484c54d41c583805cba0cac7fddbd9c92adf747fccf5640a4318da15a5ca7f28a455d3e2ed3fa27d1d542e1a32a424f43b443382b9a935a4ab763dcbb75a9636dc49959db109b6c130203010001';

/**
 * A supported chain ID for testing purposes
 */
export const SUPPORTED_CHAIN_ID = Number(Object.keys(NETWORK_CONFIGS)[0]);
/**
 * An unsupported chain ID for testing purposes
 */
export const UNSUPPORTED_CHAIN_ID = 999_999;

/**
 * Dummy Gateway wallet private key for testing purposes
 */
export const TEST_GATEWAY_PRIVATE_KEY =
  '0xdef456def456def456def456def456def456def456def456def456def456def4';
/**
 * Dummy Gateway address for testing purposes
 */
export const TEST_GATEWAY_ADDRESS =
  '0xF8da78B54951Fd47ca160bce1B208aECC308817F';

/**
 * Dummy typed handles for each Solidity type for testing purposes
 */
export const DUMMY_TYPED_HANDLES: Record<SolidityType, HexString> = {
  bool: '0xaa00066eee0001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  address: '0xaa00066eee0101aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes: '0xaa00066eee0201aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  string: '0xaa00066eee0301aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint8: '0xaa00066eee0401aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint16: '0xaa00066eee0501aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint24: '0xaa00066eee0601aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint32: '0xaa00066eee0701aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint40: '0xaa00066eee0801aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint48: '0xaa00066eee0901aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint56: '0xaa00066eee0a01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint64: '0xaa00066eee0b01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint72: '0xaa00066eee0c01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint80: '0xaa00066eee0d01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint88: '0xaa00066eee0e01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint96: '0xaa00066eee0f01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint104: '0xaa00066eee1001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint112: '0xaa00066eee1101aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint120: '0xaa00066eee1201aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint128: '0xaa00066eee1301aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint136: '0xaa00066eee1401aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint144: '0xaa00066eee1501aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint152: '0xaa00066eee1601aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint160: '0xaa00066eee1701aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint168: '0xaa00066eee1801aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint176: '0xaa00066eee1901aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint184: '0xaa00066eee1a01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint192: '0xaa00066eee1b01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint200: '0xaa00066eee1c01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint208: '0xaa00066eee1d01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint216: '0xaa00066eee1e01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint224: '0xaa00066eee1f01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint232: '0xaa00066eee2001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint240: '0xaa00066eee2101aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint248: '0xaa00066eee2201aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uint256: '0xaa00066eee2301aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int8: '0xaa00066eee2401aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int16: '0xaa00066eee2501aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int24: '0xaa00066eee2601aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int32: '0xaa00066eee2701aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int40: '0xaa00066eee2801aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int48: '0xaa00066eee2901aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int56: '0xaa00066eee2a01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int64: '0xaa00066eee2b01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int72: '0xaa00066eee2c01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int80: '0xaa00066eee2d01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int88: '0xaa00066eee2e01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int96: '0xaa00066eee2f01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int104: '0xaa00066eee3001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int112: '0xaa00066eee3101aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int120: '0xaa00066eee3201aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int128: '0xaa00066eee3301aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int136: '0xaa00066eee3401aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int144: '0xaa00066eee3501aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int152: '0xaa00066eee3601aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int160: '0xaa00066eee3701aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int168: '0xaa00066eee3801aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int176: '0xaa00066eee3901aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int184: '0xaa00066eee3a01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int192: '0xaa00066eee3b01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int200: '0xaa00066eee3c01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int208: '0xaa00066eee3d01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int216: '0xaa00066eee3e01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int224: '0xaa00066eee3f01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int232: '0xaa00066eee4001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int240: '0xaa00066eee4101aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int248: '0xaa00066eee4201aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  int256: '0xaa00066eee4301aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes1: '0xaa00066eee4401aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes2: '0xaa00066eee4501aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes3: '0xaa00066eee4601aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes4: '0xaa00066eee4701aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes5: '0xaa00066eee4801aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes6: '0xaa00066eee4901aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes7: '0xaa00066eee4a01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes8: '0xaa00066eee4b01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes9: '0xaa00066eee4c01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes10: '0xaa00066eee4d01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes11: '0xaa00066eee4e01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes12: '0xaa00066eee4f01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes13: '0xaa00066eee5001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes14: '0xaa00066eee5101aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes15: '0xaa00066eee5201aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes16: '0xaa00066eee5301aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes17: '0xaa00066eee5401aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes18: '0xaa00066eee5501aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes19: '0xaa00066eee5601aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes20: '0xaa00066eee5701aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes21: '0xaa00066eee5801aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes22: '0xaa00066eee5901aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes23: '0xaa00066eee5a01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes24: '0xaa00066eee5b01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes25: '0xaa00066eee5c01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes26: '0xaa00066eee5d01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes27: '0xaa00066eee5e01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes28: '0xaa00066eee5f01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes29: '0xaa00066eee6001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes30: '0xaa00066eee6101aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes31: '0xaa00066eee6201aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bytes32: '0xaa00066eee6301aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
};

export const DUMMY_DECRYPTION_PROOF_SIGNATURE = `0x${'deadbeef'.padStart(65 * 2, '0')}`;

/***
 * Encrypted data of different solidity types for testing purposes
 *
 * NB: `encryptedSharedSecret` is encrypted with RSA `TEST_RSA_SPKI_PUB_KEY`
 */
export const TEST_ENCRYPTED_DATA = {
  string: {
    encryptedSharedSecret:
      '0x5d6e4fb84073a59570bd257be5df9f373cb157b4273ac4cc663f5b10d7a2b7b0b9216cfc62fcda225e84935f71b80a95a6a1a9464972dde25e61d3670364a3dab52e7d7c3bc589f5149a59147c9296b724a0aa41804d07ed97611849dd56d6ed96b5179e25d0bd8b303a7f09bedc0314ca8a1c0289cb5b15092407521bfc72c6e037e44ecdc15387338151ccc96e16cc1be4a73de757961c2da3fe4684e6db6650850e69327f24e3ab0116cd4b07b170b73440756498692ec8f691c6111030a47296fb8e4578382df29718d730fa36385d0ebcea8c889e7ca00645ab9f3b652843d2414f28780429701a430612d2396fbb0ccaf23eb4ecf881a08a5cd123dce3',
    iv: '0x31325f627974657321212121',
    ciphertext:
      '0x01764bc2ad93e7fa69228415c0ab2090036f868a9b19d07cfa089d2cbb98dfc765822b191911b5de93372c84f06c4280f4d0f0',
    plaintext:
      '0x546869732061206e65772073656e74656e636520746f20626520656e63727970746564',
    value: 'This a new sentence to be encrypted',
  },
  bytes: {
    encryptedSharedSecret:
      '0x1404401545b34b7673c041256aafddf4a111ea024eb8999dd4fb678ec425f8ad186b8847f84d136f16be3da140bfd4d633e3ac81d22b70d024a369f460ff55448f46aeb3fd17477f5e2c6a5ad44cf0888732db4bebf0a188fb00e6bb0ef0ed9bf7750e90276e3cb741b9fc8bdfd2850366a3fea897c0822c745b77a01ed0180b1d913c81d94233444e3ffcb22ce7504e0883ddce9c85b6b5b2428473a375f42ad8d85b5d974b2a4cbb3bae7c52a946f41a98c040417efe5c06592744fd6720ce6c1cddb1616c7ac7a61d4ffbd3f56a0f8690ad3b19f5d9edecc1fb3fbb356c361a0361aa6dc7facd7009c3c633e4b1a241a7b8abe84d67055bceec5bf0be2781',
    iv: '0x31325f627974657321212121',
    ciphertext: '0x28bb555ee038af05622f06ed4a406ddfae1c0786155e89303c7d05',
    plaintext: '0x666f6f206261722062617a',
    value: '0x666f6f206261722062617a',
  },
  bool: {
    encryptedSharedSecret:
      '0x8262b4c3ebc172e83fb62a28089261173a93ba240fa7ad5a19f25a9eacb128a88061271b50b473f4144692a617062a50279efd2a51a70caf593ed1c5b18d2548fd5a46bfb507efc3334965b2694e8fd94165930ecf5c10ec75c497ba0678ee09057f5de15f56bbbdc461a727df149c8b61a25f4c5cb6309d344f1952823e4c956a6d49f4eefe473ff60092d0f866cc06a7539acbf46c23a38ef26703a59a91604bb0ac9c48859781a8bb8a868521989c0d5536a4f87536c56d91b7f88836512a4651a495e079159f5007323f18a6811d5419db433f79bd6a90300efaeca6b5eeee879dd684a2ac3f652728918e16b9be916547ded9f0c84135485b6cd70473cf',
    iv: '0x31325f627974657321212121',
    ciphertext: '0x4ead139190d6e22d30d488be8a9155d41d',
    plaintext: '0x01',
    value: true,
  },
  int64: {
    encryptedSharedSecret:
      '0x781ecbb84dba0cadfc92d4d8851cbbda8c8371997115de2797940f000e620dc289063916c5bdb8cf2de911f4b91d0c9cc281bc8230a596ba4053f824223449c4faada08ca9b8eefeafee8f870402027e4afa5204f16bd6157c591c16188408083826a9c84b16d42569a572bf72bdc3a5a37951f5e69fb0b5b3cf8e5fd7b816551c0088634c4193bde78405dc9c887ce88e543b11ffd3f3d1956946a0d61b7c4d09282440fe53ba60c31988b5bdfe9f3ab83143d3665728600c63e59df25c0459105e68e21c4330df6c818555cc24e34608ba483bff65e9acccfd48ccff275cafa94b1dc26421678600334e1081fbfdcabf1e1ae1d6a48507d015c34fbfd40a61',
    iv: '0x31325f627974657321212121',
    ciphertext: '0x7ec87aa61a7e479fe205ba779887f32e5af9232bf569de5c',
    plaintext: '0xffffffffffffffff',
    value: -1n,
  },
  uint256: {
    encryptedSharedSecret:
      '0x5271df95f0eef3e09c58d7986112c45e9c9c09fc91a7941d1a77cdf1522f73f8524fe5d73f275b931f867c48baf79e9af85d5801becbb22b719e5af71aa61241dd212afb2b0636e671acaacc4dec5df0185c79f2e328bea36a27e22f43f6ee81186081b1e609a1112bc78d580b6936588543cf28a0cf11329c1366dfef939c748ae3910ae67abb1929ff4e2fdd7796a38961dc05d4855b84eefdceb72ad9f56c03c263c9c493c4ca5531c036005582e1730be0adf0f57fd87e880c380eab5408ba519b6b4e3753f820cae1fb4ef5ee8fc84e397bdc4a243647deefc98b46eb1ec5b3b04f277fdde9eb07cf5a4732d2dcff51a0a6ce01665910fc0397a8aeda61',
    iv: '0x31325f627974657321212121',
    ciphertext:
      '0xff2be310a18f954c859c854d96fea9176704888c76a936a799b6fd80f7ddf2147330213855a820335f1126ff3d61ed83',
    plaintext:
      '0x2636a8beb2c41b8ccafa9a55a5a5e333892a83b491df3a67d2768946a9f9c6dc',
    value:
      17_284_462_622_264_544_996_732_051_027_471_161_485_894_692_198_059_332_613_183_480_558_325_149_058_780n,
  },
  bytes8: {
    encryptedSharedSecret:
      '0x781ecbb84dba0cadfc92d4d8851cbbda8c8371997115de2797940f000e620dc289063916c5bdb8cf2de911f4b91d0c9cc281bc8230a596ba4053f824223449c4faada08ca9b8eefeafee8f870402027e4afa5204f16bd6157c591c16188408083826a9c84b16d42569a572bf72bdc3a5a37951f5e69fb0b5b3cf8e5fd7b816551c0088634c4193bde78405dc9c887ce88e543b11ffd3f3d1956946a0d61b7c4d09282440fe53ba60c31988b5bdfe9f3ab83143d3665728600c63e59df25c0459105e68e21c4330df6c818555cc24e34608ba483bff65e9acccfd48ccff275cafa94b1dc26421678600334e1081fbfdcabf1e1ae1d6a48507d015c34fbfd40a61',
    iv: '0x31325f627974657321212121',
    ciphertext: '0x7ec87aa61a7e479fe205ba779887f32e5af9232bf569de5c',
    plaintext: '0xffffffffffffffff',
    value: '0xffffffffffffffff',
  },
  address: {
    encryptedSharedSecret:
      '0x1e73358fa164468310a4ed5d3f8c6bf809f668a9abfc1763a29b54a4e18ae9ddbf5b170d4f4e49ec50f39cf32d63b0887f08af6b2824e350e317606218f1f3eaf9a09baec624f0f66cba58fabad1c7ae93e25b735a267626ca4f7f9b6bab824ecd0b64af19532d1ee82918386e1afa11ac9c9e2982452ad222e903fd30782c3412edd3adc6fa80ed092c76147e48f4724f5bb085597a8af107af7ca541703d9a5e66fcca3ca5b04dc303af3679904359477ca16f060ba90df5d97be88965fbf9c978d4f3d4ac2ac7062636ffb16a79fd3120e5039afbd41314b7fd44823969cab751fcdcd32257236596a225ee006eaf03aaf492f67aff6bbea81f829ffdcbcc',
    iv: '0x31325f627974657321212121',
    ciphertext:
      '0x58d3cdeedbd62a5779bb083b8700305af72022822a691dc6a474d08d41adc2bc06cdf043',
    plaintext: '0xf048ef3d7e3b33a465e0599e641bb29421f7df92',
    value: '0xf048ef3d7e3b33a465e0599e641bb29421f7df92',
  },
};

/**
 * EIP-712 typed data for testing purposes.
 */
export const TEST_EIP712_TYPED_DATA: EIP712TypedData = {
  domain: {
    name: 'MyApp',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
  primaryType: 'Person',
  message: {
    name: 'Alice',
    wallet: '0x1234567890123456789012345678901234567890',
  },
};
