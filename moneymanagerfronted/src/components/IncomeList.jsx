import {Download, LoaderCircle, Mail} from "lucide-react";
import TransactionInfoCard from "./TransactionInfoCard.jsx";
import moment from "moment";
import {useState} from "react";

const IncomeList = ({transactions, onDelete, onDownload, onEmail}) => {
    const [loading, setLoading] = useState(false);
    const handleEmail = async () => {
        setLoading(true);
        try {
            await onEmail();
        }finally {
            setLoading(false);
        }
    }
    const handleDownload = async () => {
        setLoading(true);
        try {
            await onDownload();
        }finally {
            setLoading(false);
        }
    }
    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <h5 className="text-lg">Income Sources</h5>
                <div className="flex items-center justify-end gap-2">
                    <button disabled={loading} className="card-btn" onClick={handleEmail}>
                        {loading ? (
                            <>
                                <LoaderCircle className="w-4 h-4 animate-spin"/>
                                Emailing...
                            </>
                        ): (
                            <>
                                <Mail size={15} className="text-base" />
                                Email
                            </>
                        )}
                    </button>
                    <button disabled={loading} className="card-btn" onClick={handleDownload}>
                        {loading ? (
                            <>
                                <LoaderCircle className="w-4 h-4 animate-spin"/>
                                Downloading...
                            </>
                        ): (
                            <>
                                <Download size={15} className="text-base" />
                                Download
                            </>
                        )}

                    </button>
                </div>
            </div>

            <div className="min-h-[200px] flex items-center">
                {transactions && transactions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
                        {/* display the incomes */}
                        {transactions.map((income) => (
                            <TransactionInfoCard
                                key={income.id || income._id}
                                title={income.name}
                                icon={income.icon}
                                date={moment(income.date).format('Do MMM YYYY')}
                                amount={income.amount}
                                type="income"
                                onDelete={() => onDelete(income.id || income._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center w-full">
                        <p className="text-gray-400">No income records found. Add your first income to get started!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default IncomeList;