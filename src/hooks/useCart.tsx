import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    console.log(cart)
    try {
      const productAlreadyInCart = cart.find(product=>product.id==productId);
      if(!productAlreadyInCart){
        const{data:product}=await api.get<Product>(`products/${productId}`)
        const{data:stock}=await api.get<Stock>(`stock/${productId}`)
        if(stock.amount>0){
          setCart([...cart,{...product, amount:1}])
          localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cart,{...product,amount:1}]))
          toast('Adicionado')
          return
        }
      }
      if (productAlreadyInCart){
        const {data:stock}=await api.get<Stock>(`stock/${productId}`)
        if(stock.amount>productAlreadyInCart.amount){
          const updateCart=cart.map(cartItem=>cartItem.id==productId?{
            ...cartItem,
            amount:Number(cartItem.amount)+1
          }:cartItem)
          setCart(updateCart)
          localStorage.setItem('@RocketShoes:cart',JSON.stringify(updateCart))
          toast('adicionado')
          return;
        }else{
          toast.error('Quantidade fora de estoque')
        }
      }
    } catch {

    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists=cart.some(cartProduct=>cartProduct.id==productId);
      if(!productExists){
        toast.error('Erro na remoção')
        return;
      }
      const updateCart=cart.filter(cartItem=>cartItem.id!=productId)
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(updateCart))
    } catch {
      toast.error("erro na remoção")
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount<1){
        toast.error('erro na alteração do produto')
        return
      }
      const response=await api.get(`/stock/${productId}`)
      const productAmount = response.data.amount
      const stockIsAvaliable=amount > productAmount

      if (stockIsAvaliable){
  
        return
      }
      const productExists=cart.some(cartProduct=>cartProduct.id==productId);
      if(!productExists){
        toast.error('Erro na alteração')
        return;
      }
      const updateCart = cart.map(cartItem=>cartItem.id==productId?{
        ...cartItem,
        amount:amount
      }:cartItem)
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(updateCart))
    } catch {
      toast.error("erro na alteração")
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
