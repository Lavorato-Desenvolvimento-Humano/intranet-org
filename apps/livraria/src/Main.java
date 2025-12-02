
 entity.Biblioteca;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Biblioteca biblioteca = new Biblioteca();

        Scanner sc = new Scanner(System.in);
        String respostaUsuario = "Seleciona a opção correta:\n1. Cadastrar Livro";
        respostaUsuario = sc.nextLine();

        while(!respostaUsuario.equalsIgnoreCase("1")) {
            switch (respostaUsuario) {
                case "1":
                    System.out.println("Para cadastrar um livro, informe: (id,titulo,autor");

            }
        }


    }
}