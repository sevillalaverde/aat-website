'use client';
export default function AddToken() {
  const add = async () => {
    if (!('ethereum' in window)) return alert('No wallet detected.');
    try {
      // EIP-747
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x993aF915901CC6c2b8Ee38260621dc889DCb3C54',
            symbol: 'AAT',
            decimals: 18,
            image: 'https://theaat.xyz/aat-logo-256.png'
          }
        }
      });
    } catch (e: any) {
      alert(e?.message || 'Failed to add token.');
    }
  };
  return (
    <button onClick={add} className="px-4 py-2 rounded-xl border">
      Add $AAT to Wallet
    </button>
  );
}
