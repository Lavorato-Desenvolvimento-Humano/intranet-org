export const formatDate = (dateString: string): string => {
  if (!dateString) return "";

  try {
    if (dateString.includes("T")) {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } else {
      const [year, month, day] = dateString.split("-");
      const localDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      return localDate.toLocaleDateString("pt-BR");
    }
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "";

  try {
    return new Date(dateString).toLocaleString("pt-BR");
  } catch (error) {
    console.error("Erro ao formatar data e hora:", error);
    return dateString;
  }
};

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;

  try {
    let birth: Date;

    if (birthDate.includes("T")) {
      birth = new Date(birthDate);
    } else {
      const [year, month, day] = birthDate.split("-");
      birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    console.error("Erro ao calcular idade:", error);
    return 0;
  }
};

export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";

  try {
    let date: Date;

    if (dateString.includes("T")) {
      date = new Date(dateString);
    } else {
      const [year, month, day] = dateString.split("-");
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Erro ao formatar data para input:", error);
    return "";
  }
};

export const isFutureDate = (dateString: string): boolean => {
  if (!dateString) return false;

  try {
    let date: Date;

    if (dateString.includes("T")) {
      date = new Date(dateString);
    } else {
      const [year, month, day] = dateString.split("-");
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera as horas para comparação correta

    return date > today;
  } catch (error) {
    console.error("Erro ao verificar data futura:", error);
    return false;
  }
};

export const formatPeriod = (mes: number, ano: number): string => {
  if (!mes || !ano) return "";

  return `${mes.toString().padStart(2, "0")}/${ano}`;
};

export const convertBrDateToISO = (brDate: string): string => {
  if (!brDate) return "";

  try {
    const [day, month, year] = brDate.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } catch (error) {
    console.error("Erro ao converter data brasileira para ISO:", error);
    return "";
  }
};
