export interface SqlTransaction {
  executeSql(
    sql: string,
    args?: any[],
    success?: (tx: any, result: any) => void,
    error?: (tx: any, err: any) => void,
  ): void
}

export interface Database {
  transaction(
    cb: (tx: SqlTransaction) => void,
    error?: (err: any) => void,
    success?: () => void,
  ): void
}

export default Database
