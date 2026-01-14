import { hexToBytes } from '../../../src/utils/hexToBytes.js';
import {
  generateRsaKeyPair,
  exportRsaPublicKey,
  rsaDecrypt,
} from '../../../src/utils/rsa.js';

import { describe, it, expect } from 'vitest';

describe('rsa', () => {
  describe('generateRsaKeyPair', () => {
    it('should generate an RSA key pair', async () => {
      const { publicKey, privateKey } = await generateRsaKeyPair();
      expect(publicKey).toBeInstanceOf(CryptoKey);
      expect(privateKey).toBeInstanceOf(CryptoKey);
    });
  });

  describe('exportRsaPublicKey', () => {
    it('should export the RSA public key to SPKI format hex string with "0x" prefix', async () => {
      const keyPair = await generateRsaKeyPair();
      const publicKeyHex = await exportRsaPublicKey(keyPair);
      expect(typeof publicKeyHex).toBe('string');
      expect(publicKeyHex).toMatch(/^0x([0-9a-f]{2})+$/);
    });
  });

  describe('rsaDecrypt', () => {
    it('should decrypt ciphertext correctly', async () => {
      const privateKeyHex =
        '0x308204be020100300d06092a864886f70d0101010500048204a8308204a40201000282010100ea518f56d262ec34b2e8283c4c89caad8cc35735c7d4710140fc4bcbbfbefd1393a69cf5d291e88ad7263a53a5b5a411390a934ee29342a7f1c28c92e67430b4e7515d0781601312d00205bb00241cf5c50eaed75d7c69a8202241afd24ab259873b8f0bc8aafecc73b9b2af2b6c241f29f783a66563e97a511f0d931924ebc4577670ff797c93943a8bec54ca1fade1f658b5904c25bf767a70ef975c88c1b3bccf94619aa2b18cc1ca1bb53779c45eebf94832d27eef16612e4f4098e3ca9eeead07a030fc8c79fef2d5a079aec4cf712c9e656035d496fb81a554248480f001188595ab709d9fba1dc5f91b22669046f12aea6ee2968722c933c8e4b8b6c1020301000102820100286f0c8a11e1ea1aa9e8afd0bff0631e11953fbe530e50b5c3ae05b2521335fea3d2f370e3f633a789bada03c72b91f53adf9d4dd6814cd6483ca71f4e4f2c7c7b122a387a55c6d4cf3a1a1d0bc82f8b2587041abbd2153562de26719d9b302d8ccd7540b64ef38afa4948113c2ffc07b8a932798b33737d9cf3fbd6af5714abc74f0e4aa111d918e92cf5f1de32428e390077926c66b9d077f16d17afa60baa68ef0d1598f55c38870d634719d1bd8fe94e69cd2f883fc49fea757e6e1517c448bf97f1b9b71bb77db9b74149a0a7ca481375114d3bd3ffcfe18922989ade67e47258910b305b8461ad2090141326f0f8477e21e6cfc9a9ca46d8d8a290600102818100eda1690afdd71170fc87cf738900e000e688e961c0e3e9df6ee343c676791dea0532d5c4517492f0d657ae60a86839c4108d82dbf1fe68d5677f7ab1f4c10843a1d4717dcf0608ca77818f37eed348d624e8f6efa7f05545020eedda59336cc1a58c8534c9b12bd63e06cf445c5aea1b12342cb0e4fb5f6f9badb1dad1cdb58102818100fc6e9bc210052af7fa218f84481cba2c96993509c27cd7fc3127d3c47a16e62be6fb1266bae899081850ab06faefc800ff5c65e38eaec3c2ce03bb579edf483eb888415a2518a4168a104c9c5c5cd25b7fe1d64d08db0dbc98bc54d24998dc290a91cbd45b9d90547e4056a2e499a56d812655e933a9f2fcba239bd6971821410281803ca5933f80e560c82b4b2600e0985e931c4318fd1fd38b1ec1183375f54a97fddff1c768e139153f6e14d6a64894c1196ef80ecbbf89248c426be08e865eb5933d3c10f300e1136148fac1e88e8551f3855c0799c68ca9d680ddfa8a5d75a86e0ba83f5ee792d61349a54744b52566d61de13efeae92111b54ea11983d2f79010281810098f4f0be6b74a62fb249e9ab8f029130f96406464ea9d53a04130cf78dbf18635bc7a0c3ccd7a9fac4b90498eb2ea5f32cc8b1186cd9aad6fc7c38658467e95fcff3081e7641f313913f051cedbe74dc6aa5ce73c93cea9aefb596740192753d0d2180efc13fbd37e57458cac557f06c650874a024e502ce6e7fab2b214cc6c102818100c1c9c73ba2eee47c9257ef6448e6b32a85b21e04f1a7731bdb11da7f2c8024da346d5ecf737169fae230cbb6b6ea187373557c51d48ea75714ed3e097bb658f6fa0bc77b35051e63142dabc4be50d8554b607a187f9cf8bca92f24e6e28fd1948b74b742761b8dfe17254e0ebd46d5e76600b4a2f15618a8c83b064d2ce7770e';
      const ciphertext =
        '0x2c8ae13670a29bdc7b677fb0778180840583a5b0851c1e0353bfdb9b9331ce4bd5a542960b8f0f01cc875d49d42f57dff178fbc9a943f2c503718432078dd27e7fab9eecd3afce26b0824eb21e0bcecea772a82c2cae3f189f0b324e926fbbb1c9534034732b0fc4938aca3d8b43c3f72dda438a295927fedf49d22250981b93291df41601484004ede0e42884f69da0f1c6f24fc6cbc6a1d9fd83b3293b79f687b0fe08a73936f1a7cbf1bc9992c6aca987456f49eab22e3b6a9489d78c102287a7f5827ae57f656b788e6ed42f04c0150ab424a1af7c2fad40bd1799918ac9923f23239b9ebecb009b5170b1c9d714f223441378c9cb856b88c16dc8747c29';
      const expectedPlaintext =
        '0x02be9a93b92278142c7a9c82d45d81f4dea995d4446c3a439a1204b8fe15d9c807';

      // import keyPair
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        hexToBytes(privateKeyHex),
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt']
      );

      const decryptedHex = await rsaDecrypt({
        privateKey,
        ciphertext,
      });
      expect(decryptedHex).toBe(expectedPlaintext);
    });
  });
});
