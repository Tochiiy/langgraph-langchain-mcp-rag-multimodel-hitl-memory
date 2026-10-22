
type HttpVerb="GET"|"PUT"|"POST"|"DELETE"


export function makeHttpReq<T>(verb:HttpVerb,endpoint:string,input?:T){

    return new Promise(async(resolve,reject)=>{

        try {
           
            const res=await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/${endpoint}`,{
                headers:{
                    accept:"application/json",
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(input),
                method:verb
            })

           
            // if(!res.ok) throw new Error('Failed to process this request')
            if(!res.ok) throw new Error(res.statusText)

            const data=await res.json()

            resolve(data)
            
        } catch (error) {
            reject(error)
            
        }

    })
}