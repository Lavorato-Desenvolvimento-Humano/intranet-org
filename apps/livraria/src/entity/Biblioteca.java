package entity;

import java.util.ArrayList;
import java.util.List;

public class Biblioteca {
    private List<Livro> livros = new ArrayList<>();
    private List<Autor> autores = new ArrayList<>();
    private List<Emprestimo> emprestimos = new ArrayList<>();

    public Biblioteca() {}

    public Biblioteca(List<Livro> livros, List<Autor> autores, List<Emprestimo> emprestimos) {
        this.livros = livros;
        this.autores = autores;
        this.emprestimos = emprestimos;
    }

    public List<Livro> getLivros() {
        return livros;
    }

    public void setLivros(List<Livro> livros) {
        this.livros = livros;
    }

    public List<Autor> getAutores() {
        return autores;
    }

    public void setAutores(List<Autor> autores) {
        this.autores = autores;
    }

    public List<Emprestimo> getEmprestimos() {
        return emprestimos;
    }

    public void setEmprestimos(List<Emprestimo> emprestimos) {
        this.emprestimos = emprestimos;
    }

    public void cadastrarLivros(Livro livro) {
        List<Livro> livros = getLivros();

        livros.add(livro);
        System.out.println("Livro cadastrado com sucesso!");
    }
}
