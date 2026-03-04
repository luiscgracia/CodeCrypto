fn main() {
    let mut pila = Vec::new();
    pila.push(1);
    pila.push(2);
    pila.push(3);

    while let Some(top) = pila.pop() {
        println!("Top: {}", top);
    }
}