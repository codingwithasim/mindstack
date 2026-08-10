



export async function request<T>(url: string, options?: RequestInit): Promise<T>{

    const response = await fetch(
        url,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers
            }
        }
    )

    if(!response.ok){
        throw new Error(`API error: ${response.status}`)
    }

    return response.json()
}