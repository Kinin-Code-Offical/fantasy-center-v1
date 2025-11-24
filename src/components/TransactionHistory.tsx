import React from 'react';

interface TransactionHistoryProps {
    ledgers: any[];
    tradesInitiated: any[];
    tradesReceived: any[];
}

export default function TransactionHistory({ ledgers, tradesInitiated, tradesReceived }: TransactionHistoryProps) {

    return (
        <div className="grid grid-cols-1 gap-8 font-mono">
            {/* Wallet History */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    Ledger Stream
                </h3>
                <div className="space-y-1">
                    {ledgers.length === 0 ? (
                        <p className="text-gray-600 text-xs italic pl-4 border-l border-gray-800">No transactions recorded.</p>
                    ) : (
                        ledgers.map(ledger => (
                            <div key={ledger.id} className="flex justify-between items-center py-2 px-3 hover:bg-white/5 border-l border-transparent hover:border-purple-500 transition-all group">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-600">{new Date(ledger.createdAt).toLocaleDateString('en-GB')}</span>
                                    <p className="text-xs text-gray-300 group-hover:text-white transition-colors">{ledger.description || ledger.type}</p>
                                </div>
                                <span className={`text-xs font-bold ${ledger.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {ledger.amount >= 0 ? '+' : ''}{ledger.amount}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Trade History */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    Trade Logs
                </h3>
                <div className="space-y-1">
                    {[...tradesInitiated, ...tradesReceived].length === 0 ? (
                        <p className="text-gray-600 text-xs italic pl-4 border-l border-gray-800">No trade activity.</p>
                    ) : (
                        [...tradesInitiated, ...tradesReceived].slice(0, 5).map(trade => (
                            <div key={trade.id} className="flex justify-between items-center py-2 px-3 hover:bg-white/5 border-l border-transparent hover:border-blue-500 transition-all group">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${trade.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' :
                                        trade.status === 'OPEN' ? 'bg-blue-900/30 text-blue-400' :
                                            'bg-gray-800 text-gray-400'
                                        }`}>
                                        {trade.status.substring(0, 3)}
                                    </span>
                                    <p className="text-xs text-gray-300 group-hover:text-white transition-colors">
                                        {trade.scope === 'MARKETPLACE' ? 'MARKET' : 'DIRECT'}
                                    </p>
                                </div>
                                <span className="text-[10px] text-gray-600">{new Date(trade.createdAt).toLocaleDateString('en-GB')}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
